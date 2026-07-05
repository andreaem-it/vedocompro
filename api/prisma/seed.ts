import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fixture geografiche legacy: web/json/{regioni,province,comuni}.json (Symfony, isolato in
// legacy-symfony/). Contengono solo id/nome/relazioni per le select a cascata regione->
// provincia->comune, NON i campi ricchi delle entity Doctrine (coordinate, istat, cod_fisco,
// superficie, popolazione) — quei dati non hanno alcuna fixture nel progetto legacy, quindi
// restano null (vedi commenti in schema.prisma).
const LEGACY_JSON_DIR = path.join(__dirname, '../../legacy-symfony/web/json');

interface RegioneFixture {
  id: string;
  nome: string;
}

interface ProvinciaFixture {
  id: string;
  id_regione: string;
  nome: string;
  sigla_automobilistica: string;
}

interface ComuneFixture {
  id_provincia: string;
  nome: string;
}

// I file legacy hanno virgole finali prima di `}`/`]`, non valide per JSON.parse standard.
function readLegacyJson<T>(filename: string): T {
  const raw = fs.readFileSync(path.join(LEGACY_JSON_DIR, filename), 'utf-8');
  const sanitized = raw.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(sanitized) as T;
}

// Categorie marketplace: nessuna fixture/DataFixtures Doctrine presente nel legacy (le
// repository sono boilerplate vuoto), ma l'albero reale con gli ID di produzione è
// incorporato come navigazione statica in
// legacy-symfony/app/Resources/views/template/footer.html.twig (categoria=<id>). Estratto
// 1:1 da lì: 6 categorie padre + figli, copertura completa degli ID referenziati ovunque nei
// template (`grep -roh 'categoria=[0-9]+'`). Alcuni ID legacy nella sequenza (1,9,18,23,28,38
// = padri presunti; 32,34,36,37,45,46 = probabili sotto-categorie aggiuntive) non hanno nome
// recuperabile da nessun fixture/template del repo e sono stati omessi di conseguenza.
const CATEGORY_TREE: { name: string; children: string[] }[] = [
  {
    name: 'Motori',
    children: ['Auto', 'Accessori Auto', 'Moto e Scooter', 'Accessori Moto', 'Nautica', 'Caravan e Camper', 'Veicoli Commerciali'],
  },
  {
    name: 'Immobili',
    children: ['Appartamenti', 'Camere/Posti letto', 'Ville singole e a Schiera', 'Terreni e rustici', 'Garage e Box', 'Loft e mansarde', 'Case vacanza', 'Uffici e locali'],
  },
  {
    name: 'Lavoro e Servizi',
    children: ['Offerte di lavoro', 'Servizi', 'Candidati', 'Attrezzatura'],
  },
  {
    name: 'Tecnologia',
    children: ['Computer', 'Consolle e Videogames', 'Audio/Video', 'Fotografia', 'Smartphone', 'Tablet'],
  },
  {
    name: 'Per la Casa e la Persona',
    children: ['Arredo e Casalinghi', 'Elettrodomestici', 'Giardinaggio', 'Abbigliamento', 'Bambini'],
  },
  {
    name: 'Sport e Hobby',
    children: ['Animali', 'Musica e Film', 'Libri e Riviste', 'Strumenti Musicali', 'Sport', 'Biciclette', 'Collezionismo'],
  },
];

async function seedCategories() {
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log(`[categorie] già popolate (${existing} righe), skip.`);
    return;
  }

  let parents = 0;
  let children = 0;
  for (const group of CATEGORY_TREE) {
    await prisma.category.create({
      data: {
        name: group.name,
        children: { create: group.children.map((name) => ({ name })) },
      },
    });
    parents++;
    children += group.children.length;
  }
  console.log(`[categorie] creati ${parents} gruppi padre + ${children} sotto-categorie.`);
}

async function seedGeo() {
  const [regioniCount, provinceCount, comuniCount] = await Promise.all([
    prisma.regione.count(),
    prisma.province.count(),
    prisma.comune.count(),
  ]);
  if (regioniCount > 0 || provinceCount > 0 || comuniCount > 0) {
    console.log(`[geo] già popolato (regioni=${regioniCount}, province=${provinceCount}, comuni=${comuniCount}), skip.`);
    return;
  }

  const regioniFixture = readLegacyJson<RegioneFixture[]>('regioni.json');
  const provinceFixture = readLegacyJson<ProvinciaFixture[]>('province.json');
  const comuniFixture = readLegacyJson<ComuneFixture[]>('comuni.json');

  // Gli ID legacy di regioni/province sono preservati (createMany con id esplicito) perché
  // comuni.json referenzia le province solo tramite id_provincia, senza nomi: serve lo stesso
  // ID per ricostruire la relazione. Le sequenze Postgres vengono riallineate a fine inserimento.
  await prisma.regione.createMany({
    data: regioniFixture.map((r) => ({ id: parseInt(r.id, 10), nome: r.nome })),
  });

  await prisma.province.createMany({
    data: provinceFixture.map((p) => ({
      id: parseInt(p.id, 10),
      regioneId: parseInt(p.id_regione, 10),
      nome: p.nome,
      siglaAutomobilistica: p.sigla_automobilistica,
    })),
  });

  const provinceById = new Map(
    provinceFixture.map((p) => [parseInt(p.id, 10), { nome: p.nome, regioneId: parseInt(p.id_regione, 10) }]),
  );
  const regioneNomeById = new Map(regioniFixture.map((r) => [parseInt(r.id, 10), r.nome]));

  const comuniData: { provinceId: number; comune: string; regione: string; provincia: string }[] = [];
  let orphaned = 0;
  for (const c of comuniFixture) {
    const provinceId = parseInt(c.id_provincia, 10);
    const provincia = provinceById.get(provinceId);
    const regioneNome = provincia ? regioneNomeById.get(provincia.regioneId) : undefined;
    if (!provincia || !regioneNome) {
      orphaned++;
      continue;
    }
    comuniData.push({ provinceId, comune: c.nome, regione: regioneNome, provincia: provincia.nome });
  }

  await prisma.comune.createMany({ data: comuniData });

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('regioni','id'), COALESCE((SELECT MAX(id) FROM regioni), 1))`,
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('province','id'), COALESCE((SELECT MAX(id) FROM province), 1))`,
  );

  console.log(
    `[geo] creati ${regioniFixture.length} regioni, ${provinceFixture.length} province, ${comuniData.length} comuni` +
      (orphaned > 0 ? ` (${orphaned} comuni scartati per provincia non risolvibile)` : '') +
      '.',
  );
}

// Parametri predefiniti per sotto-categoria (AdvancedField): compaiono nel form
// annuncio, nel dettaglio (solo se valorizzati — sono tutti opzionali) e, se
// filterable, come filtri nella ricerca. L'admin può modificarli/estenderli da
// /admin/categorie/[id]/campi.
type FieldDef = { name: string; type?: 'select' | 'text' | 'number'; options?: string[]; filterable?: boolean };

const ENERGY_CLASSES = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'];
const FUELS = ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrida', 'Elettrica'];

const CATEGORY_FIELDS: Record<string, FieldDef[]> = {
  // Tecnologia
  Smartphone: [
    { name: 'Marca', type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Huawei', 'OnePlus', 'Motorola', 'Oppo', 'Altro'] },
    { name: 'Modello', type: 'text', filterable: false },
    { name: 'Colore', type: 'text' },
    { name: 'Capacità', type: 'select', options: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
  ],
  Tablet: [
    { name: 'Marca', type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Lenovo', 'Huawei', 'Altro'] },
    { name: 'Colore', type: 'text' },
    { name: 'Capacità', type: 'select', options: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
  ],
  Computer: [
    { name: 'Tipo', type: 'select', options: ['Notebook', 'Desktop', 'All-in-One', 'Mini PC', 'Server'] },
    { name: 'Processore', type: 'text' },
    { name: 'RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB', 'Oltre 64 GB'] },
    { name: 'Disco rigido', type: 'text' },
    { name: 'Scheda video', type: 'text', filterable: false },
  ],
  'Consolle e Videogames': [
    { name: 'Piattaforma', type: 'select', options: ['PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch', 'PC', 'Retro/Altro'] },
  ],
  Fotografia: [
    { name: 'Marca', type: 'select', options: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus', 'Altro'] },
    { name: 'Tipo', type: 'select', options: ['Reflex', 'Mirrorless', 'Compatta', 'Obiettivo', 'Drone', 'Accessorio'] },
  ],
  'Audio/Video': [
    { name: 'Tipo', type: 'text' },
    { name: 'Marca', type: 'text' },
  ],
  // Motori
  Auto: [
    { name: 'Marca', type: 'text' },
    { name: 'Modello', type: 'text', filterable: false },
    { name: 'Anno', type: 'number' },
    { name: 'Chilometri', type: 'number', filterable: false },
    { name: 'Alimentazione', type: 'select', options: FUELS },
    { name: 'Cambio', type: 'select', options: ['Manuale', 'Automatico'] },
  ],
  'Moto e Scooter': [
    { name: 'Marca', type: 'text' },
    { name: 'Cilindrata (cc)', type: 'number' },
    { name: 'Anno', type: 'number' },
    { name: 'Chilometri', type: 'number', filterable: false },
  ],
  Nautica: [
    { name: 'Lunghezza (m)', type: 'number' },
    { name: 'Anno', type: 'number' },
    { name: 'Motore', type: 'text', filterable: false },
  ],
  'Caravan e Camper': [
    { name: 'Anno', type: 'number' },
    { name: 'Chilometri', type: 'number', filterable: false },
    { name: 'Posti letto', type: 'number' },
  ],
  'Veicoli Commerciali': [
    { name: 'Anno', type: 'number' },
    { name: 'Chilometri', type: 'number', filterable: false },
    { name: 'Alimentazione', type: 'select', options: FUELS },
  ],
  // Immobili
  Appartamenti: [
    { name: 'Metri quadri', type: 'number' },
    { name: 'Locali', type: 'number' },
    { name: 'Camere da letto', type: 'number' },
    { name: 'Bagni', type: 'number' },
    { name: 'Piano', type: 'text', filterable: false },
    { name: 'Classe energetica', type: 'select', options: ENERGY_CLASSES },
    { name: 'Arredato', type: 'select', options: ['Sì', 'No', 'Parzialmente'] },
  ],
  'Ville singole e a Schiera': [
    { name: 'Metri quadri', type: 'number' },
    { name: 'Locali', type: 'number' },
    { name: 'Camere da letto', type: 'number' },
    { name: 'Bagni', type: 'number' },
    { name: 'Classe energetica', type: 'select', options: ENERGY_CLASSES },
    { name: 'Giardino', type: 'select', options: ['Privato', 'Condominiale', 'Assente'] },
  ],
  'Camere/Posti letto': [
    { name: 'Metri quadri', type: 'number' },
    { name: 'Arredato', type: 'select', options: ['Sì', 'No', 'Parzialmente'] },
    { name: 'Spese incluse', type: 'select', options: ['Sì', 'No'] },
  ],
  'Case vacanza': [
    { name: 'Metri quadri', type: 'number' },
    { name: 'Posti letto', type: 'number' },
    { name: 'Camere da letto', type: 'number' },
    { name: 'Bagni', type: 'number' },
  ],
  'Loft e mansarde': [
    { name: 'Metri quadri', type: 'number' },
    { name: 'Bagni', type: 'number' },
    { name: 'Classe energetica', type: 'select', options: ENERGY_CLASSES },
  ],
  'Uffici e locali': [
    { name: 'Metri quadri', type: 'number' },
    { name: 'Bagni', type: 'number' },
  ],
  'Garage e Box': [{ name: 'Metri quadri', type: 'number' }],
  'Terreni e rustici': [
    { name: 'Metri quadri', type: 'number' },
    { name: 'Edificabile', type: 'select', options: ['Sì', 'No'] },
  ],
  // Casa e persona
  Abbigliamento: [
    { name: 'Taglia', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Altro'] },
    { name: 'Colore', type: 'text' },
    { name: 'Genere', type: 'select', options: ['Uomo', 'Donna', 'Unisex', 'Bambino'] },
  ],
  Elettrodomestici: [
    { name: 'Marca', type: 'text' },
    { name: 'Classe energetica', type: 'select', options: ENERGY_CLASSES },
  ],
  // Sport e hobby
  Biciclette: [
    { name: 'Tipo', type: 'select', options: ['Corsa', 'MTB', 'City bike', 'E-bike', 'Gravel', 'Pieghevole', 'Bambino'] },
    { name: 'Taglia', type: 'text' },
  ],
  'Strumenti Musicali': [
    { name: 'Strumento', type: 'text' },
    { name: 'Marca', type: 'text' },
  ],
  Animali: [
    { name: 'Razza', type: 'text' },
    { name: 'Età', type: 'text', filterable: false },
  ],
  'Libri e Riviste': [{ name: 'Autore', type: 'text', filterable: false }],
};

async function seedCategoryFields() {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const byName = new Map(categories.map((c) => [c.name, c.id]));

  let created = 0;
  let skipped = 0;
  for (const [categoryName, fields] of Object.entries(CATEGORY_FIELDS)) {
    const categoryId = byName.get(categoryName);
    if (!categoryId) {
      console.warn(`[campi] categoria "${categoryName}" non trovata, skip.`);
      continue;
    }
    // Idempotente PER CATEGORIA: se l'admin ha già campi (anche modificati), non tocchiamo
    const existing = await prisma.advancedField.count({ where: { categoryId } });
    if (existing > 0) {
      skipped += 1;
      continue;
    }
    await prisma.advancedField.createMany({
      data: fields.map((f, i) => ({
        categoryId,
        name: f.name,
        type: f.type ?? 'text',
        options: f.options ?? [],
        filterable: f.filterable !== false,
        required: false, // tutti opzionali, come richiesto
        sortOrder: i + 1,
      })),
    });
    created += fields.length;
  }
  console.log(`[campi] creati ${created} parametri categoria (${skipped} categorie già configurate, skip).`);
}

async function main() {
  await seedCategories();
  await seedGeo();
  await seedCategoryFields();
}

main()
  .catch((err) => {
    console.error('Seed fallito:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

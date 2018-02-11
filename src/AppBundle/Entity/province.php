<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * province
 *
 * @ORM\Table(name="province")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\provinceRepository")
 */
class province
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var int
     *
     * @ORM\Column(name="id_regione", type="integer")
     */
    private $idRegione;

    /**
     * @var int
     *
     * @ORM\Column(name="codice_citta_metropolitana", type="integer")
     */
    private $codiceCittaMetropolitana;

    /**
     * @var string
     *
     * @ORM\Column(name="nome", type="text")
     */
    private $nome;

    /**
     * @var string
     *
     * @ORM\Column(name="sigla_automobilistica", type="string", length=255)
     */
    private $siglaAutomobilistica;

    /**
     * @var string
     *
     * @ORM\Column(name="latitudine", type="decimal", precision=10, scale=0)
     */
    private $latitudine;

    /**
     * @var string
     *
     * @ORM\Column(name="longitudine", type="decimal", precision=10, scale=0)
     */
    private $longitudine;


    /**
     * Get id
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set idRegione
     *
     * @param integer $idRegione
     *
     * @return province
     */
    public function setIdRegione($idRegione)
    {
        $this->idRegione = $idRegione;

        return $this;
    }

    /**
     * Get idRegione
     *
     * @return int
     */
    public function getIdRegione()
    {
        return $this->idRegione;
    }

    /**
     * Set codiceCittaMetropolitana
     *
     * @param integer $codiceCittaMetropolitana
     *
     * @return province
     */
    public function setCodiceCittaMetropolitana($codiceCittaMetropolitana)
    {
        $this->codiceCittaMetropolitana = $codiceCittaMetropolitana;

        return $this;
    }

    /**
     * Get codiceCittaMetropolitana
     *
     * @return int
     */
    public function getCodiceCittaMetropolitana()
    {
        return $this->codiceCittaMetropolitana;
    }

    /**
     * Set nome
     *
     * @param string $nome
     *
     * @return province
     */
    public function setNome($nome)
    {
        $this->nome = $nome;

        return $this;
    }

    /**
     * Get nome
     *
     * @return string
     */
    public function getNome()
    {
        return $this->nome;
    }

    /**
     * Set siglaAutomobilistica
     *
     * @param string $siglaAutomobilistica
     *
     * @return province
     */
    public function setSiglaAutomobilistica($siglaAutomobilistica)
    {
        $this->siglaAutomobilistica = $siglaAutomobilistica;

        return $this;
    }

    /**
     * Get siglaAutomobilistica
     *
     * @return string
     */
    public function getSiglaAutomobilistica()
    {
        return $this->siglaAutomobilistica;
    }

    /**
     * Set latitudine
     *
     * @param string $latitudine
     *
     * @return province
     */
    public function setLatitudine($latitudine)
    {
        $this->latitudine = $latitudine;

        return $this;
    }

    /**
     * Get latitudine
     *
     * @return string
     */
    public function getLatitudine()
    {
        return $this->latitudine;
    }

    /**
     * Set longitudine
     *
     * @param string $longitudine
     *
     * @return province
     */
    public function setLongitudine($longitudine)
    {
        $this->longitudine = $longitudine;

        return $this;
    }

    /**
     * Get longitudine
     *
     * @return string
     */
    public function getLongitudine()
    {
        return $this->longitudine;
    }
}


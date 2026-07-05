<?php

namespace AppBundle\Form;

use AppBundle\Entity\Category;
use Doctrine\ORM\EntityRepository;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\CountryType;
use Symfony\Component\Form\Extension\Core\Type\DateTimeType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\MoneyType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class AdsBusinessType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $category = new Category;
        $builder
            ->add('name', TextType::class, [
                'required' => false,
                'label' => 'Nome Oggetto'
            ])
            ->add('category', EntityType::class, array(
                'class' => 'AppBundle:Category',
                'placeholder' => 'Scegli Categoria',
                'empty_data' => null,
                'required' => true,
                'label' => 'Categoria',
                'group_by' => 'parentName',
                'choice_label' => 'name',
                'choice_value' => 'id',
                'query_builder' => function (EntityRepository $repo) {
                    $qb = $repo->createQueryBuilder('l');
                    $qb->andWhere('l.parent IS NOT NULL');
                    return $qb;
                },
                'help' => 'Selezionare nuovamente la categoria',
                ))
//            ->add('category', EntityType::class, array(
//                'class' => Category::class,
//                'group_by' => 'parentName',
//                'data' => function (EntityRepository $repo) {
//                    $qb = $repo->createQueryBuilder('l');
//                    return $qb;
//                },
//                'query_builder' => function (EntityRepository $repo) {
//                    $qb = $repo->createQueryBuilder('l');
//                    $qb->andWhere('l.parent IS NOT NULL');
//                    return $qb;
//                },
//                'label' => 'Categoria'))
            ->add('price', MoneyType::class, [
                'required' => false,
                'label' => 'Prezzo'
            ])
            ->add('description', TextareaType::class, [
                'attr' => ['rows'=> '10'],
                'required' => false, 'label' => 'Descrizione'
            ])
            ->add('region', ChoiceType::class, array(
                'choices' => [
                    'Tutta Italia' => 'Tutta Italia',
                    'Valle d\'Aosta' => 'Valle d\'Aosta',
                    'Piemonte' => 'Piemonte',
                    'Liguria' => 'Liguria',
                    'Lombardia' => 'Lombardia',
                    'Trentino Alto Adige' => 'Trentino Alto Adige',
                    'Veneto' => 'Veneto',
                    'Friuli Venezia Giulia' => 'Friuli Venezia Giulia',
                    'Emilia Romagna' => 'Emili Romagna',
                    'Toscana' => 'Toscana',
                    'Umbria' => 'Umbria',
                    'Lazio' => 'Lazio',
                    'Marche' => 'Marche',
                    'Abruzzo' => 'Abruzzo',
                    'Molise' => 'Molise',
                    'Campania' => 'Campania',
                    'Puglia' => 'Puglia',
                    'Basilicata' => 'Basilicata',
                    'Calabria' => 'Calabria',
                    'Sardegna' => 'Sardegna',
                    'Sicilia' => 'Sicilia'

                ],
                'label' => 'Regione'))
            ->add('location', TextType::class, [
                //'placeholder' => 'Seleziona Regione',
                'required' => true,
                //'choices' => [],
                'label' => 'Città'
            ])
            ->add('provincia', TextType::class, [
                'required' => true,
                'label' => 'Provincia'
            ])
            ->add('country', CountryType::class, [
                'required' => false,
                'mapped' => false,
                'placeholder' => 'Italia',
                'label' => 'Paese'
            ])
            ->add('objCondition', ChoiceType::class, [
                'choices' => [
                    'Seleziona' => '',
                    'Nuovo' => 'Nuovo',
                    'Usato' => 'Usato',
                    'Ricondizionato' => 'Ricondizionato',
                    'Non Funzionante' => 'Non Funzionante'
                ],
                'label' => 'Condizione Oggetto'
            ])
            ->add('published', ChoiceType::class, [
                'choices' => [
                    'Si' => 1,
                    'No' => 0
                ],
                'required' => false,
                'label' => 'Pubblicato'
            ])
            ->add('fields', CollectionType::class, [
                'entry_type' => TextType::class,
                'required' => false,
                'entry_options' => ['label' => false],
                'label' => 'Campi Opzionali',
            ])
            ->add('vals', CollectionType::class, [
                'entry_type' => TextType::class,
                'required' => false,
                'entry_options' => ['label' => false],
                'label' => 'Valori'
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'Salva'
            ]);


    }/**
     * {@inheritdoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'AppBundle\Entity\Ads'
        ));
    }

    /**
     * {@inheritdoc}
     */
    public function getBlockPrefix()
    {
        return 'appbundle_ads';
    }

}

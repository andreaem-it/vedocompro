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

class AdsUserType extends AbstractType
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
                'label' => 'Nome Oggetto',
                'attr' => [
                    'class' => 'list-item-shadow'
                ]
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
                'attr' => [
                    'class' => 'list-item-shadow'
                ],
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
                'label' => 'Prezzo',
                'attr' => [
                    'class' => 'list-item-shadow'
                ]
            ])
            ->add('description', TextareaType::class, [
                'attr' => ['rows'=> '10','class' => 'list-item-shadow'],
                'required' => false, 'label' => 'Descrizione',
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
                'attr' => [
                    'class' => 'list-item-shadow'
                ],
                'label' => 'Regione'))
            ->add('location', TextType::class, [
                //'placeholder' => 'Seleziona Regione',
                'required' => true,
                //'choices' => [],
                'label' => 'Città',
                'attr' => [
                    'class' => 'list-item-shadow'
                ]
            ])
            ->add('provincia', TextType::class, [
                'required' => true,
                'label' => 'Provincia',
                'attr' => [
                    'class' => 'list-item-shadow'
                ]
            ])
            ->add('country', CountryType::class, [
                'required' => false,
                'mapped' => false,
                'placeholder' => 'Italia',
                'label' => 'Paese',
                'attr' => [
                    'class' => 'list-item-shadow'
                ]
            ])
            ->add('objCondition', ChoiceType::class, [
                'choices' => [
                    'Seleziona' => '',
                    'Nuovo' => 'Nuovo',
                    'Usato' => 'Usato',
                    'Ricondizionato' => 'Ricondizionato',
                    'Non Funzionante' => 'Non Funzionante'
                ],
                'label' => 'Condizione Oggetto',
                'attr' => [
                    'class' => 'list-item-shadow'
                ]
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'Aggiorna',
                'attr' => [
                    'class' => 'btn btn-outline-primary'
                ]
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

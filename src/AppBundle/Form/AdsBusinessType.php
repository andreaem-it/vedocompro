<?php

namespace AppBundle\Form;

use AppBundle\Entity\Category;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\DateTimeType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
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
        $builder
            ->add('name', TextType::class, [
                'required' => false,
                'label' => 'Nome Oggetto'
            ])
            ->add('category', EntityType::class, [
                'class' => Category::class,
                'label' => 'Categoria',
                'data' => Category::class
            ])
            ->add('price', TextType::class, [
                'required' => false,
                'label' => 'Prezzo'
            ])
            ->add('description', TextareaType::class, [
                'attr' => ['rows'=> '10'],
                'required' => false, 'label' => 'Descrizione'
            ])
            ->add('region', TextType::class, [
                'required' => false,
                'label' => 'Regione'
            ])
            ->add('location', TextType::class, [
                'required' => false,
                'label' => 'Città'
            ])
            ->add('provincia', TextType::class, [
                'required' => false,
                'label' => 'Provincia'
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
                'label' => 'Campi Opzionali'
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

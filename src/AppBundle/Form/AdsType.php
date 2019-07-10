<?php

namespace AppBundle\Form;

use AppBundle\Entity\Category;
use AppBundle\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\DateTimeType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class AdsType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name', TextType::class, ['required' => false])
            ->add('category', EntityType::class, ['class' => Category::class])
            ->add('price', TextType::class, ['required' => false])
            ->add('description', TextareaType::class, ['attr' => ['rows'=> '10']],['required' => false])
            ->add('region', TextType::class, ['required' => false])
            ->add('location', TextType::class, ['required' => false])
            ->add('provincia', TextType::class, ['required' => false])
            ->add('uname', EntityType::class, ['class' => User::class])
            ->add('creationtime', DateTimeType::class, ['html5' => true, 'widget' => 'single_text','required' => false])
            ->add('updatetime', DateTimeType::class, ['html5' => true, 'widget' => 'single_text','required' => false])
            ->add('views', IntegerType::class, ['required' => false])
            ->add('objCondition', ChoiceType::class, ['choices' => ['Seleziona' => '', 'Nuovo' => 'Nuovo', 'Usato' => 'Usato', 'Ricondizionato' => 'Ricondizionato', 'Non Funzionante' => 'Non Funzionante']])
            ->add('objLevel', ChoiceType::class, ['choices' => ['Nessuno' => '0','Oro' => '1', 'Argento' => '2', 'Bronzo' => '3']])
            ->add('showcase', ChoiceType::class, ['choices' => ['No' => '0', 'Si' => '1']])
            ->add('goldPromotionEndDate', DateTimeType::class,['html5' => true, 'widget' => 'single_text', 'required' => false])
            ->add('silverPromotionEndDate', DateTimeType::class, ['html5' => true, 'widget' => 'single_text', 'required' => false])
            ->add('bronzePromotionEndDate', DateTimeType::class, ['html5' => true, 'widget' => 'single_text', 'required' => false])
            ->add('sold', TextType::class, ['required' => false])
            ->add('trackingCode', TextType::class, ['required' => false])
            ->add('video', TextType::class, ['required' => false])
            ->add('published', ChoiceType::class, ['choices' => ['Si' => 1, 'No' => 0],'required' => false])
            ->add('fields', CollectionType::class, ['entry_type' => TextType::class, 'required' => false])
            ->add('vals', CollectionType::class, ['entry_type' => TextType::class, 'required' => false])
            ->add('submit', SubmitType::class, ['label' => 'Salva']);
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

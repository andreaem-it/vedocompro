<?php

namespace AppBundle\Form;

use AppBundle\Entity\ShopShipments;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\MoneyType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ShopShipmentsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('serviceName', TextType::class, ['label' => 'Nome Servizio'])
            ->add('basePrice', MoneyType::class, ['label' => 'Prezzo Base'])
            ->add('expectedDelivery', TextType::class, ['label' => 'Tempi Spedizione', 'attr' => ['class' => 'mb-0', 'alt' => 'Specificare i due valori separati da un trattino (Es: 2-4)']])
            ->add('serviceLogo',TextType::class, ['label' => 'URL Logo'])
            ->add('isActive', CheckboxType::class, ['label' => 'Attivo'])
            ->add('submit', SubmitType::class, ['label' => 'Aggiungi'])
        ;
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => ShopShipments::class,
        ]);
    }
}

<?php

namespace AppBundle\Form;

use AppBundle\Entity\ShopProducts;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ShopProductsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name')
            ->add('price')
            ->add('video')
            ->add('pics')
            ->add('isActive')
            ->add('inStock')
            ->add('createdAt')
            ->add('updatedAt')
            ->add('category')
        ;
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => ShopProducts::class,
        ]);
    }
}

<?php

namespace AppBundle\Form;

use AppBundle\Entity\ShopCategories;
use AppBundle\Entity\ShopProducts;
use Doctrine\ORM\EntityRepository;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\MoneyType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ShopProductsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name')
            ->add('price', MoneyType::class, [
                'grouping' => true
            ])
            ->add('video')
            ->add('pics')
            ->add('isActive', CheckboxType::class, [
                'required' => false,
                'attr' => [

                ]
            ])
            ->add('inStock')
            ->add('category', EntityType::class, [
                'class' => ShopCategories::class,
                'multiple' => true,
                'expanded' => false,
                'choice_label' => 'name',
                'by_reference' => false,
                'group_by' => 'father',
                'query_builder' => function (EntityRepository $er) {
                    return $er->createQueryBuilder('c')
                            ->select('c')
                            ->where('c.children is NULL')
                            ->orderBy('c.id');
                }
            ])
            ->add('submit', SubmitType::class)
        ;
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => ShopProducts::class,
        ]);
    }
}

<?php
/**
 * TwigPass.php
 * avanzu-admin-2
 * Date: 29.12.15
 */

namespace Avanzu\AdminThemeBundle\DependencyInjection\Compiler;


use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

/**
 * Class TwigPass
 */
class TwigPass implements CompilerPassInterface
{

    /**
     * You can modify the container here before it is dumped to PHP code.
     *
     * @param ContainerBuilder $container
     */
    public function process(ContainerBuilder $container)
    {
        $bundles = $container->getParameter('kernel.bundles');

        if( true !== $container->getParameter('avanzu_admin_theme.use_twig') ) {
            return;
        }

        if (! isset($bundles['TwigBundle']) ) {
            return;
        }

        $param = $container->getParameter('twig.form.resources');

        if( ! is_array($param) ) {
            $param = array();
        }

        array_push($param, 'AvanzuAdminThemeBundle:layout:form-theme.html.twig');

        $container->setParameter('twig.form.resources', $param);

        $twigDefinition = $container->getDefinition('twig');

        $twigDefinition->addMethodCall('addGlobal', array(
                'avanzu_admin_context',
                new Reference('avanzu_admin_theme.context_helper')
            )
        );

    }
}
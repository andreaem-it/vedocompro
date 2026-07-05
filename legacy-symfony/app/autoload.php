<?php

use Doctrine\Common\Annotations\AnnotationRegistry;
use Composer\Autoload\ClassLoader;

/** @var ClassLoader $loader */
$loader = require __DIR__.'/../vendor/autoload.php';
$loader->add('aftership','/vedor/aftership/aftership-php-sdk');

AnnotationRegistry::registerLoader([$loader, 'loadClass']);

return $loader;

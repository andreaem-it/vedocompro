<?php

namespace AppBundle\Controller;


use AppBundle\Entity\ShopCategories;
use AppBundle\Entity\ShopProducts;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

/**
 * @Route("/shop")
 */
class ShopController extends Controller
{
    /**
     * @Route("/", name="shop")
     */
    public function index() {

        $categories = $this->getDoctrine()->getRepository(ShopCategories::class)->findAll();
        $items = $this->getDoctrine()->getRepository(ShopProducts::class)->findAll();

        return $this->render('shop/index.html.twig', [
            'items' => $items,
            'categories' => $categories,
            'func' => $this
        ]);
    }

    /**
     * @Route("/carrello", name="shop_cart")
     */
    public function cart() {

        return $this->render('shop/cart.html.twig');
    }

    /**
     * @Route("/{cat}/{id}/{product}", name="shop_item_details")
     */
    public function item($id) {

        $item = $this->getDoctrine()->getRepository(ShopProducts::class)->find($id);

        return $this->render('shop/item.html.twig', [
            'item' => $item
        ]);
    }

    function slugify($string, $replace = array(), $delimiter = '-') {
        // https://github.com/phalcon/incubator/blob/master/Library/Phalcon/Utils/Slug.php
        if (!extension_loaded('iconv')) {
            throw new Exception('iconv module not loaded');
        }
        // Save the old locale and set the new locale to UTF-8
        $oldLocale = setlocale(LC_ALL, '0');
        setlocale(LC_ALL, 'en_US.UTF-8');
        $clean = iconv('UTF-8', 'ASCII//TRANSLIT', $string);
        if (!empty($replace)) {
            $clean = str_replace((array) $replace, ' ', $clean);
        }
        $clean = preg_replace("/[^a-zA-Z0-9\/_|+ -]/", '', $clean);
        $clean = strtolower($clean);
        $clean = preg_replace("/[\/_|+ -]+/", $delimiter, $clean);
        $clean = trim($clean, $delimiter);
        // Revert back to the old locale
        setlocale(LC_ALL, $oldLocale);
        return $clean;
    }
}
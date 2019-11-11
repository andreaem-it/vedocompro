<?php

namespace AppBundle\Controller;


use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

/**
 * @Route("/shop")
 */
class ShopController extends Controller
{
    /**
     * @Route("/")
     */
    public function index() {

        return $this->render('shop/index.html.twig');
    }

    /**
     * @Route("/carrello", name="cart")
     */
    public function cart() {

        return $this->render('shop/cart.html.twig');
    }

    /**
     * @Route("/categoria/prodotto", name="item_details")
     */
    public function item() {

        return $this->render('shop/item.html.twig');
    }
}
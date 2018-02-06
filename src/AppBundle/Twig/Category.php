<?php
namespace AppBundle\Twig;

class Category extends \Twig_Extension 
{
  public function get_category_name($id) {
        $category = $this->getDoctrine()
        ->getRepository('AppBundle:Category')
        ->findBy(array('id' => $id));
        
        return $category;
    }
}
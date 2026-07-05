<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 27/08/17
 * Time: 18:11
 */

namespace AppBundle\Controller;


use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;

class ErrorController extends Controller
{
    /**
     * @Route("errore/{error}", name="error")
     * @param $error
     * @return response
     */
    public function errorAction($error)
    {
        switch ($error) {
            case '01-001':
                $error_title = 'Errore Generico';
                $error_body = 'Si è verificato un\'errore inaspettato, stiamo cercando di risolvere al più presto. ';
                break;
            case '02-001':
                $error_title = 'Inserzione non trovata';
                $error_body = 'L\'inserzione che stavi cercando non esiste più. L\'oggetto potrebbe essere già stato venduto. Rivolgiti al venditore per ulteriori spiegazioni. ';
                break;
            case '02-002':
                $error_title = 'Inserzione scaduta';
                $error_body = 'L\'inserzione che stavi cercando è scaduta. Rivolgiti al venditore per ulteriori spiegazioni. ';
                break;
            case '02-003':
                $error_title = 'Inserzione non ancora pubblicata';
                $error_body = 'L\'inserzione che stavi cercando non è ancora stata pubblicata. Attendi che il nostro staff l\'approvi.';
                break;
            case '03-001':
                $error_title = 'Utente non trovato';
                $error_body = 'L\'utente che stavi cercando non esiste. ';
                break;
            case '03-002':
                $error_title = 'Utente non più attivo';
                $error_body = 'L\'utente che stavi cercando non è più dei nostri. Abbiamo preso provvedimenti nei suoi confronti per condotta scorretta. ';
                break;
            case '03-005':
                $error_title = 'Sei stato bannato dalla piattaforma';
                $error_body = ['La tua presenza in questa piattaforma non è più gradita. Il tuo accesso è stato revocato. Troverai maggiori informazioni nella tua casella e-mail.',' Se sei certo vi sia stato un\'errore puoi contattare il nostro '];
                $link_title = "HelpDesk";
                $link_href = "/helpdesk";
                break;

        }

        if(isset($link_title) && isset($link_href)) {
            return $this->render('default/error.html.twig',[
                'error_title' => $error_title,
                'error_body' => $error_body,
                'link_title' => $link_title,
                'link_href' => $link_href
            ]);
        } else {
            return $this->render('default/error.html.twig',[
                'error_title' => $error_title,
                'error_body' => $error_body,
            ]);
        }


    }
}
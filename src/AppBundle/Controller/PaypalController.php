<?php

namespace AppBundle\Controller;

use AppBundle\Entity\Payment;
use Doctrine\DBAL\Exception\ReadOnlyException;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class PaypalController extends Controller
{
    /**
     *
     * @Method("POST")
     *
     * @Route("paypalnotify", name="paypalnotify")
     *
     * @param Request $request
     */
    public function paypalNotifyAction(Request $request)
    {
        $logger = $this->get('logger');

        // leggi il post del sistema PayPal e aggiungi cmd
        $req = 'cmd=_notify-validate';

        foreach ($_POST as $key => $value) {
            $value = urlencode($value);
            $req .= "&$key=$value";
        }

        $logger->info('req = ' . $req);

        // reinvia al sistema PayPal per la convalida
        $ch = curl_init('http://www.paypal.com/cgi-bin/webscr');
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $req);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Connection: Close'));

        if (!($res = curl_exec($ch))) {
            $logger->critical("Got " . curl_error($ch) . " when processing IPN data");
            curl_close($ch);
            return new Response('error', 500);
        }
        curl_close($ch);

        if (strcmp($res, "VERIFIED") == 0) {
            // assegna variabili inviate a variabili locali
            $item_name = $_POST['item_name'];
            if (preg_match('/(\d+)(?::|%3A)(\d+)/', $_POST['item_number'], $matches)) {
                $item_number = $matches[1];
                $user_id = $matches[2];
            } else {
                $logger->critical('Failed to parse item number and user ID: ' . $_POST['item_number']);
                return new Response('', 500);
            }
            $payment_status = $_POST['payment_status'];
            $payment_amount = $_POST['mc_gross'];
            $payment_currency = $_POST['mc_currency'];
            $txn_id = $_POST['txn_id'];
            $receiver_email = $_POST['receiver_email'];
            $payer_email = $_POST['payer_email'];

            $em = $this->get('doctrine.orm.entity_manager');
            $productRepo = $em->getRepository('AppBundle:Product');
            $product = $productRepo->find($item_number);
            if (!$product) {
                $logger->critical('Product not found: ' . $item_number);
                return new Response('error', 500);
            }

            // controlla che payment_status sia Completed
            if ($payment_status == 'Completed') {
                $payment = new Payment();
                $payment->setUserId($user_id);
                $payment->setProductId($item_number);
                $payment->setPaypalTxnId($txn_id);
                $payment->setPrice($payment_amount);
                $payment->setPaymentConcurrency($payment_currency);
                $payment->setPaymentStatus($payment_status);
                $payment->setPaymentEmail($payer_email);
                $em->persist($payment);

                $userRepo = $em->getRepository('AppBundle:User');
                $user = $userRepo->find($user_id);
                $user->setCreditsBronze(
                    $user->getCreditsBronze() + $product->getCreditsBronze()
                );
                $user->setCreditsSilver(
                    $user->getCreditsSilver() + $product->getCreditsSilver()
                );
                $user->setCreditsGold(
                    $user->getCreditsGold() + $product->getCreditsGold()
                );
                $em->persist($user);

                $em->flush();
            } else {
                if (strcmp($res, "INVALID") == 0) {
                    $logger->critical('form non trovata');
                    return new Response('error', 500);

                }
            }

        }

        return new Response();
    }
}
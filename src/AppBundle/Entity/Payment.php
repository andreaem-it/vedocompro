<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 20/05/17
 * Time: 16:01
 */

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="payments")
 */
class Payment
{
    /**
     * @ORM\Column (type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var int
     *
     * @ORM\Column(name="user_id", type="integer")
     */
    private $userId;

    /**
     * @var int
     *
     * @ORM\Column(name="product_id", type="integer")
     */
    private $productId;

    /**
     * @ORM\Column (name="paypal_txn_id", type="string")
     */
    private $paypalTxnId;

    /**
     * @ORM\Column (type="decimal", precision=10, scale=2)
     */
    private $price;

    /**
     * @ORM\Column (name="payment_concurrency", type="string")
     */
    private $paymentConcurrency;

    /**
     * @ORM\Column (name="payment_status", type="string")
     */
    private $paymentStatus;

    /**
     * @ORM\Column (name="payment_email", type="string")
     */
    private $paymentEmail;

    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set userId
     *
     * @param integer $userId
     *
     * @return Payment
     */
    public function setUserId($userId)
    {
        $this->userId = $userId;

        return $this;
    }

    /**
     * Get userId
     *
     * @return integer
     */
    public function getUserId()
    {
        return $this->userId;
    }

    /**
     * Set productId
     *
     * @param integer $productId
     *
     * @return Payment
     */
    public function setProductId($productId)
    {
        $this->productId = $productId;

        return $this;
    }

    /**
     * Get productId
     *
     * @return integer
     */
    public function getProductId()
    {
        return $this->productId;
    }

    /**
     * Set paypalTxnId
     *
     * @param string $paypalTxnId
     *
     * @return Payment
     */
    public function setPaypalTxnId($paypalTxnId)
    {
        $this->paypalTxnId = $paypalTxnId;

        return $this;
    }

    /**
     * Get paypalTxnId
     *
     * @return string
     */
    public function getPaypalTxnId()
    {
        return $this->paypalTxnId;
    }

    /**
     * Set price
     *
     * @param string $price
     *
     * @return Payment
     */
    public function setPrice($price)
    {
        $this->price = $price;

        return $this;
    }

    /**
     * Get price
     *
     * @return string
     */
    public function getPrice()
    {
        return $this->price;
    }

    /**
     * Set paymentConcurrency
     *
     * @param string $paymentConcurrency
     *
     * @return Payment
     */
    public function setPaymentConcurrency($paymentConcurrency)
    {
        $this->paymentConcurrency = $paymentConcurrency;

        return $this;
    }

    /**
     * Get paymentConcurrency
     *
     * @return string
     */
    public function getPaymentConcurrency()
    {
        return $this->paymentConcurrency;
    }

    /**
     * Set paymentStatus
     *
     * @param string $paymentStatus
     *
     * @return Payment
     */
    public function setPaymentStatus($paymentStatus)
    {
        $this->paymentStatus = $paymentStatus;

        return $this;
    }

    /**
     * Get paymentStatus
     *
     * @return string
     */
    public function getPaymentStatus()
    {
        return $this->paymentStatus;
    }

    /**
     * Set paymentEmail
     *
     * @param string $paymentEmail
     *
     * @return Payment
     */
    public function setPaymentEmail($paymentEmail)
    {
        $this->paymentEmail = $paymentEmail;

        return $this;
    }

    /**
     * Get paymentEmail
     *
     * @return string
     */
    public function getPaymentEmail()
    {
        return $this->paymentEmail;
    }
}

<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Shipments
 *
 * @ORM\Table(name="shipments")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\ShipmentsRepository")
 */
class Shipments
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="carrier", type="string", length=255)
     */
    private $carrier;

    /**
     * @var string
     *
     * @ORM\Column(name="method", type="string", length=255)
     */
    private $method;

    /**
     * @var string
     *
     * @ORM\Column(name="estimates", type="string", length=255)
     */
    private $estimates;


    /**
     * Get id
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set carrier
     *
     * @param string $carrier
     *
     * @return Shipments
     */
    public function setCarrier($carrier)
    {
        $this->carrier = $carrier;

        return $this;
    }

    /**
     * Get carrier
     *
     * @return string
     */
    public function getCarrier()
    {
        return $this->carrier;
    }

    /**
     * Set method
     *
     * @param string $method
     *
     * @return Shipments
     */
    public function setMethod($method)
    {
        $this->method = $method;

        return $this;
    }

    /**
     * Get method
     *
     * @return string
     */
    public function getMethod()
    {
        return $this->method;
    }

    /**
     * Set estimates
     *
     * @param string $estimates
     *
     * @return Shipments
     */
    public function setEstimates($estimates)
    {
        $this->estimates = $estimates;

        return $this;
    }

    /**
     * Get estimates
     *
     * @return string
     */
    public function getEstimates()
    {
        return $this->estimates;
    }
}


<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * ShopShipments
 *
 * @ORM\Table(name="shop_shipments")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\ShopShipmentsRepository")
 */
class ShopShipments
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
     * @ORM\Column(type="string", length=255)
     */
    private $serviceName;

    /**
     * @ORM\Column(type="float")
     */
    private $basePrice;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $expectedDelivery;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $serviceLogo;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isActive;


    /**
     * Get id.
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    public function getServiceName(): ?string
    {
        return $this->serviceName;
    }

    public function setServiceName(string $serviceName): self
    {
        $this->serviceName = $serviceName;

        return $this;
    }

    public function getBasePrice(): ?float
    {
        return $this->basePrice;
    }

    public function setBasePrice(float $basePrice): self
    {
        $this->basePrice = $basePrice;

        return $this;
    }

    public function getExpectedDelivery(): ?string
    {
        return $this->expectedDelivery;
    }

    public function setExpectedDelivery(string $expectedDelivery): self
    {
        $this->expectedDelivery = $expectedDelivery;

        return $this;
    }

    public function getServiceLogo(): ?string
    {
        return $this->serviceLogo;
    }

    public function setServiceLogo(string $serviceLogo): self
    {
        $this->serviceLogo = $serviceLogo;

        return $this;
    }

    public function getIsActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;

        return $this;
    }
}

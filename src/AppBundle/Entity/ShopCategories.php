<?php

namespace AppBundle\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="AppBundle\Repository\ShopCategoriesRepository")
 */
class ShopCategories
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;

    /**
     * @ORM\ManyToOne(targetEntity="AppBundle\Entity\ShopCategories")
     */
    private $father;

    /**
     * @ORM\ManyToOne(targetEntity="AppBundle\Entity\ShopCategories")
     */
    private $children;

    /**
     * @ORM\ManyToMany(targetEntity="AppBundle\Entity\ShopProducts", mappedBy="category")
     */
    private $shopProducts;

    public function __construct()
    {
        $this->shopProducts = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function __toString()
    {
        return $this->name;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getFather(): ?self
    {
        return $this->father;
    }

    public function setFather(?self $father): self
    {
        $this->father = $father;

        return $this;
    }

    public function getChildren(): ?self
    {
        return $this->children;
    }

    public function setChildren(?self $children): self
    {
        $this->children = $children;

        return $this;
    }

    /**
     * @return Collection|ShopProducts[]
     */
    public function getShopProducts(): Collection
    {
        return $this->shopProducts;
    }

    public function addShopProduct(ShopProducts $shopProduct): self
    {
        if (!$this->shopProducts->contains($shopProduct)) {
            $this->shopProducts[] = $shopProduct;
            $shopProduct->addCategory($this);
        }

        return $this;
    }

    public function removeShopProduct(ShopProducts $shopProduct): self
    {
        if ($this->shopProducts->contains($shopProduct)) {
            $this->shopProducts->removeElement($shopProduct);
            $shopProduct->removeCategory($this);
        }

        return $this;
    }
}

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
 * @ORM\Table(name="products")
 */
class Product
{
    /**
     * @ORM\Column (type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column (type="string")
     */
    private $name;

    /**
     * @ORM\Column(type="integer")
     */
    private $credits_gold = 0;

    /**
     * @ORM\Column(type="integer")
     */

    private $credits_silver = 0;

    /**
     * @ORM\Column(type="integer")
     */
    private $credits_bronze = 0;

    /**
     * @ORM\Column (type="decimal", precision=10, scale=2)
     */
    private $price;

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
     * Set name
     *
     * @param string $name
     *
     * @return Product
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set creditsGold
     *
     * @param integer $creditsGold
     *
     * @return Product
     */
    public function setCreditsGold($creditsGold)
    {
        $this->credits_gold = $creditsGold;

        return $this;
    }

    /**
     * Get creditsGold
     *
     * @return integer
     */
    public function getCreditsGold()
    {
        return $this->credits_gold;
    }

    /**
     * Set creditsSilver
     *
     * @param integer $creditsSilver
     *
     * @return Product
     */
    public function setCreditsSilver($creditsSilver)
    {
        $this->credits_silver = $creditsSilver;

        return $this;
    }

    /**
     * Get creditsSilver
     *
     * @return integer
     */
    public function getCreditsSilver()
    {
        return $this->credits_silver;
    }

    /**
     * Set creditsBronze
     *
     * @param integer $creditsBronze
     *
     * @return Product
     */
    public function setCreditsBronze($creditsBronze)
    {
        $this->credits_bronze = $creditsBronze;

        return $this;
    }

    /**
     * Get creditsBronze
     *
     * @return integer
     */
    public function getCreditsBronze()
    {
        return $this->credits_bronze;
    }

    /**
     * Set price
     *
     * @param float $price
     *
     * @return Product
     */
    public function setPrice($price)
    {
        $this->price = $price;

        return $this;
    }

    /**
     * Get price
     *
     * @return float
     */
    public function getPrice()
    {
        return $this->price;
    }
}

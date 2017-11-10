<?php
namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="ads")
 */
class Ads
{
    /**
     * @ORM\Column(type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;
    
    /**
     * @ORM\Column(type="string", length=100)
     */
    private $name;
    
    /**
     * @ORM\Column(type="integer")
     * @ORM\ManyToOne(targetEntity="Category", inversedBy="ads")
     * @ORM\JoinColumn(name="name", referencedColumnName="id")
     */
    private $category;
    
    /**
     * @ORM\Column(type="decimal", scale=2)
     */
    private $price;
    
    /**
     * @ORM\Column(type="string")
     */
    private $description;
    
    /**
     * @ORM\Column(type="string")
     */
    private $region;
    
    /**
     * @ORM\Column(type="string")
     */
    private $location;
    
    /**
     * @ORM\Column(type="integer")
     */
    private $uname;
    
    /**
     * @ORM\Column(type="datetime")
     */
    private $creationtime;
    
    /**
     * @ORM\Column(type="datetime")
     */
    private $updatetime;
    
    /**
     * @ORM\Column(type="integer")
     */
    private $views;
    
    /**
     * @ORM\Column(type="string")
     */
    private $objCondition;
    
    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $option1;
    
    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $option2;
    
    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $option3;
    
    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $option4;
    
    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $option5;

    /**
     * @ORM\Column(type="integer")
     */
    private $objLevel;

    /**
     * @ORM\Column(type="integer")
     */
    private $showcase;

    /**
     * @ORM\Column(type="integer")
     */
    private $sold;

    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $trackingCode;

    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $video;

    /**
     * @ORM\Column(type="integer")
     */
    private $published;

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
     * @return Ads
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
     * Set category
     *
     * @param integer $category
     *
     * @return Ads
     */
    public function setCategory($category)
    {
        $this->category = $category;

        return $this;
    }

    /**
     * Get category
     *
     * @return integer
     */
    public function getCategory()
    {
        return $this->category;
    }

    /**
     * Set price
     *
     * @param string $price
     *
     * @return Ads
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
     * Set description
     *
     * @param string $description
     *
     * @return Ads
     */
    public function setDescription($description)
    {
        $this->description = $description;

        return $this;
    }

    /**
     * Get description
     *
     * @return string
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * Set uname
     *
     * @param integer $uname
     *
     * @return Ads
     */
    public function setUname($uname)
    {
        $this->uname = $uname;

        return $this;
    }

    /**
     * Get uname
     *
     * @return integer
     */
    public function getUname()
    {
        return $this->uname;
    }

    /**
     * Set creationtime
     *
     * @param \timestamp $creationtime
     *
     * @return Ads
     */
    public function setCreationtime(\DateTime $creationtime = null)
    {
        $this->creationtime = $creationtime;

        return $this;
    }

    /**
     * Get creationtime
     *
     * @return \timestamp
     */
    public function getCreationtime()
    {
        return $this->creationtime;
    }

    /**
     * Set updatetime
     *
     * @param \timestamp $updatetime
     *
     * @return Ads
     */
    public function setUpdatetime(\DateTime $updatetime = null)
    {
        $this->updatetime = $updatetime;

        return $this;
    }

    /**
     * Get updatetime
     *
     * @return \timestamp
     */
    public function getUpdatetime()
    {
        return $this->updatetime;
    }

    /**
     * Set views
     *
     * @param integer $views
     *
     * @return Ads
     */
    public function setViews($views)
    {
        $this->views = $views;

        return $this;
    }

    /**
     * Get views
     *
     * @return integer
     */
    public function getViews()
    {
        return $this->views;
    }

    /**
     * Set region
     *
     * @param string $region
     *
     * @return Ads
     */
    public function setRegion($region)
    {
        $this->region = $region;

        return $this;
    }

    /**
     * Get region
     *
     * @return string
     */
    public function getRegion()
    {
        return $this->region;
    }

    /**
     * Set location
     *
     * @param string $location
     *
     * @return Ads
     */
    public function setLocation($location)
    {
        $this->location = $location;

        return $this;
    }

    /**
     * Get location
     *
     * @return string
     */
    public function getLocation()
    {
        return $this->location;
    }

    /**
     * Set option1
     *
     * @param string $option1
     *
     * @return Ads
     */
    public function setOption1($option1)
    {
        $this->option1 = $option1;

        return $this;
    }

    /**
     * Get option1
     *
     * @return string
     */
    public function getOption1()
    {
        return $this->option1;
    }

    /**
     * Set option2
     *
     * @param string $option2
     *
     * @return Ads
     */
    public function setOption2($option2)
    {
        $this->option2 = $option2;

        return $this;
    }

    /**
     * Get option2
     *
     * @return string
     */
    public function getOption2()
    {
        return $this->option2;
    }

    /**
     * Set option3
     *
     * @param string $option3
     *
     * @return Ads
     */
    public function setOption3($option3)
    {
        $this->option3 = $option3;

        return $this;
    }

    /**
     * Get option3
     *
     * @return string
     */
    public function getOption3()
    {
        return $this->option3;
    }

    /**
     * Set option4
     *
     * @param string $option4
     *
     * @return Ads
     */
    public function setOption4($option4)
    {
        $this->option4 = $option4;

        return $this;
    }

    /**
     * Get option4
     *
     * @return string
     */
    public function getOption4()
    {
        return $this->option4;
    }

    /**
     * Set option5
     *
     * @param string $option5
     *
     * @return Ads
     */
    public function setOption5($option5)
    {
        $this->option5 = $option5;

        return $this;
    }

    /**
     * Get option5
     *
     * @return string
     */
    public function getOption5()
    {
        return $this->option5;
    }

    /**
     * Set showcase
     *
     * @param integer $showcase
     *
     * @return Ads
     */
    public function setShowcase($showcase)
    {
        $this->showcase = $showcase;

        return $this;
    }

    /**
     * Get showcase
     *
     * @return integer
     */
    public function getShowcase()
    {
        return $this->showcase;
    }

    /**
     * Set sold
     *
     * @param integer $sold
     *
     * @return Ads
     */
    public function setSold($sold)
    {
        $this->sold = $sold;

        return $this;
    }

    /**
     * Get sold
     *
     * @return integer
     */
    public function getSold()
    {
        return $this->sold;
    }

    /**
     * Set trackingCode
     *
     * @param string $trackingCode
     *
     * @return Ads
     */
    public function setTrackingCode($trackingCode)
    {
        $this->trackingCode = $trackingCode;

        return $this;
    }

    /**
     * Get trackingCode
     *
     * @return string
     */
    public function getTrackingCode()
    {
        return $this->trackingCode;
    }

    /**
     * Set video
     *
     * @param string $video
     *
     * @return Ads
     */
    public function setVideo($video)
    {
        $this->video = $video;

        return $this;
    }

    /**
     * Get video
     *
     * @return string
     */
    public function getVideo()
    {
        return $this->video;
    }

    /**
     * Set published
     *
     * @param boolean $published
     *
     * @return Ads
     */
    public function setPublished($published)
    {
        $this->published = $published;

        return $this;
    }

    /**
     * Get published
     *
     * @return boolean
     */
    public function getPublished()
    {
        return $this->published;
    }

    /**
     * Set objCondition
     *
     * @param string $objCondition
     *
     * @return Ads
     */
    public function setObjCondition($objCondition)
    {
        $this->objCondition = $objCondition;

        return $this;
    }

    /**
     * Get objCondition
     *
     * @return string
     */
    public function getObjCondition()
    {
        return $this->objCondition;
    }

    /**
     * Set objLevel
     *
     * @param integer $objLevel
     *
     * @return Ads
     */
    public function setObjLevel($objLevel)
    {
        $this->objLevel = $objLevel;

        return $this;
    }

    /**
     * Get objLevel
     *
     * @return integer
     */
    public function getObjLevel()
    {
        return $this->objLevel;
    }
}

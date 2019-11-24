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
     * @ORM\Column(type="text")
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
     * @ORM\Column(type="string")
     */
    private $provincia;

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
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $goldPromotionEndDate;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $silverPromotionEndDate;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $bronzePromotionEndDate;

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
     * @ORM\Column(type="simple_array", nullable=true)
     */
    private $fields;

    /**
     * @ORM\Column(type="simple_array", nullable=true)
     */
    private $vals;

    /**
     * @ORM\Column(type="integer", nullable=true)
     */
    private $callClicks;

    /**
     * @ORM\Column(type="integer", nullable=true)
     */
    private $messageClicks;

    /**
     * @ORM\Column(type="boolean", nullable=true)
     */
    private $hasMap;

    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $mapCoords;

    /**
     * @ORM\Column(type="boolean", nullable=true)
     */
    private $hasReviews;

    /**
     * @ORM\Column(type="boolean", nullable=true)
     */
    private $isHotel;

    /**
     * @ORM\Column(type="simple_array", nullable=true)
     */
    private $services;

    /**
     * @ORM\Column(type="simple_array", nullable=true)
     */
    private $rooms;

    /**
     * @ORM\Column(type="simple_array", nullable=true)
     */
    private $tags;

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
     * @param text $description
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
     * @return text
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
     * Set provincia
     *
     * @param string $provincia
     *
     * @return Ads
     */
    public function setProvincia($provincia)
    {
        $this->provincia = $provincia;

        return $this;
    }

    /**
     * Get provincia
     *
     * @return string
     */
    public function getProvincia()
    {
        return $this->provincia;
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

    /**
     * Set goldPromotionEndDate
     *
     * @param \DateTime $goldPromotionEndDate
     *
     * @return Ads
     */
    public function setGoldPromotionEndDate($goldPromotionEndDate)
    {
        $this->goldPromotionEndDate = $goldPromotionEndDate;

        return $this;
    }

    /**
     * Get goldPromotionEndDate
     *
     * @return \DateTime
     */
    public function getGoldPromotionEndDate()
    {
        return $this->goldPromotionEndDate;
    }

    /**
     * Set silverPromotionEndDate
     *
     * @param \DateTime $silverPromotionEndDate
     *
     * @return Ads
     */
    public function setSilverPromotionEndDate($silverPromotionEndDate)
    {
        $this->silverPromotionEndDate = $silverPromotionEndDate;

        return $this;
    }

    /**
     * Get silverPromotionEndDate
     *
     * @return \DateTime
     */
    public function getSilverPromotionEndDate()
    {
        return $this->silverPromotionEndDate;
    }

    /**
     * Set bronzePromotionEndDate
     *
     * @param \DateTime $bronzePromotionEndDate
     *
     * @return Ads
     */
    public function setBronzePromotionEndDate($bronzePromotionEndDate)
    {
        $this->bronzePromotionEndDate = $bronzePromotionEndDate;

        return $this;
    }

    /**
     * Get bronzePromotionEndDate
     *
     * @return \DateTime
     */
    public function getBronzePromotionEndDate()
    {
        return $this->bronzePromotionEndDate;
    }

    /**
     * Set fields.
     *
     * @param array $fields
     *
     * @return Ads
     */
    public function setFields($fields)
    {
        $this->fields = $fields;

        return $this;
    }

    /**
     * Get fields.
     *
     * @return array
     */
    public function getFields()
    {
        return $this->fields;
    }

    /**
     * Set values.
     *
     * @param array $vals
     *
     * @return Ads
     */
    public function setVals($vals)
    {
        $this->vals = $vals;

        return $this;
    }

    /**
     * Get values.
     *
     * @return array
     */
    public function getVals()
    {
        return $this->vals;
    }

    /**
     * Set callClicks.
     *
     * @param int|null $callClicks
     *
     * @return Ads
     */
    public function setCallClicks($callClicks = null)
    {
        $this->callClicks = $callClicks;

        return $this;
    }

    /**
     * Get callClicks.
     *
     * @return int|null
     */
    public function getCallClicks()
    {
        return $this->callClicks;
    }

    /**
     * Set messageClicks.
     *
     * @param int|null $messageClicks
     *
     * @return Ads
     */
    public function setMessageClicks($messageClicks = null)
    {
        $this->messageClicks = $messageClicks;

        return $this;
    }

    /**
     * Get messageClicks.
     *
     * @return int|null
     */
    public function getMessageClicks()
    {
        return $this->messageClicks;
    }

    /**
     * Set hasMap.
     *
     * @param bool|null $hasMap
     *
     * @return Ads
     */
    public function setHasMap($hasMap = null)
    {
        $this->hasMap = $hasMap;

        return $this;
    }

    /**
     * Get hasMap.
     *
     * @return bool|null
     */
    public function getHasMap()
    {
        return $this->hasMap;
    }

    /**
     * Set mapCoords.
     *
     * @param string|null $mapCoords
     *
     * @return Ads
     */
    public function setMapCoords($mapCoords = null)
    {
        $this->mapCoords = $mapCoords;

        return $this;
    }

    /**
     * Get mapCoords.
     *
     * @return string|null
     */
    public function getMapCoords()
    {
        return $this->mapCoords;
    }

    /**
     * Set hasReviews.
     *
     * @param bool|null $hasReviews
     *
     * @return Ads
     */
    public function setHasReviews($hasReviews = null)
    {
        $this->hasReviews = $hasReviews;

        return $this;
    }

    /**
     * Get hasReviews.
     *
     * @return bool|null
     */
    public function getHasReviews()
    {
        return $this->hasReviews;
    }

    /**
     * Set isHotel.
     *
     * @param bool|null $isHotel
     *
     * @return Ads
     */
    public function setIsHotel($isHotel = null)
    {
        $this->isHotel = $isHotel;

        return $this;
    }

    /**
     * Get isHotel.
     *
     * @return bool|null
     */
    public function getIsHotel()
    {
        return $this->isHotel;
    }

    /**
     * Set services.
     *
     * @param array|null $services
     *
     * @return Ads
     */
    public function setServices($services = null)
    {
        $this->services = $services;

        return $this;
    }

    /**
     * Get services.
     *
     * @return array|null
     */
    public function getServices()
    {
        return $this->services;
    }

    /**
     * Set rooms.
     *
     * @param array|null $rooms
     *
     * @return Ads
     */
    public function setRooms($rooms = null)
    {
        $this->rooms = $rooms;

        return $this;
    }

    /**
     * Get rooms.
     *
     * @return array|null
     */
    public function getRooms()
    {
        return $this->rooms;
    }

    /**
     * Set tags.
     *
     * @param array|null $tags
     *
     * @return Ads
     */
    public function setTags($tags = null)
    {
        $this->rooms = $tags;

        return $this;
    }

    /**
     * Get tags.
     *
     * @return array|null
     */
    public function getTags()
    {
        return $this->tags;
    }
}

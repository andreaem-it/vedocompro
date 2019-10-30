<?php

namespace AppBundle\Entity;

use DateTime;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

use FOS\UserBundle\Model\User as BaseUser;
use AppBundle\Security\Core\User\OAuthFailureHandler;
/**
 * @Entity
 * @ORM\Table(name="users")
 * @UniqueEntity("email")
 * @UniqueEntity("username")
 */
class User extends BaseUser
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\Column(type="string", length=100)
     */
    private $name;

    /** @ORM\Column(name="facebook_id", type="string", length=255, nullable=true) */
    protected $facebook_id;

    /** @ORM\Column(name="facebook_access_token", type="string", length=255, nullable=true) */
    protected $facebook_access_token;

    /** @ORM\Column(name="google_id", type="string", length=255, nullable=true) */
    protected $google_id;

    /** @ORM\Column(name="google_access_token", type="string", length=255, nullable=true) */
    protected $google_access_token;

    /**
     * @ORM\Column(type="date")
     */
    private $datejoin;

    /**
     * @ORM\Column(type="string")
     */
    private $address = "";

    /**
     * @ORM\Column(type="integer")
     */
    private $points = 0;

    /**
     * @ORM\Column(type="string")
     */
    private $phone = "-";

    /**
     * @ORM\Column(type="string")
     */
    private $realname;

    /**
     * @ORM\Column(type="string")
     */
    private $city = "";

    /**
     * @ORM\Column(type="string")
     */
    private $cap;

    /**
     * @ORM\Column(type="string")
     */
    private $code;

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
     * @ORM\Column(type="string", nullable=true)
     */
    private $pic;

    /**
     * @ORM\Column(type="integer", nullable=true)
     */
    private $isCompany;

    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $companyLogo;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $companyWebsite;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    protected $plainPassword;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $businessEnd;

    public function __construct()
    {
        parent::__construct();
        // your own logic
    }

    /**
     * Set datejoin
     *
     * @param \DateTime $datejoin
     *
     * @return User
     */
    public function setDatejoin($datejoin)
    {
        $this->datejoin = $datejoin;

        return $this;
    }

    /**
     * Get datejoin
     *
     * @return \DateTime
     */
    public function getDatejoin()
    {
        return $this->datejoin;
    }

    /**
     * Set address
     *
     * @param string $address
     *
     * @return User
     */
    public function setAddress($address)
    {
        $this->address = $address;

        return $this;
    }

    /**
     * Get address
     *
     * @return string
     */
    public function getAddress()
    {
        return $this->address;
    }

    /**
     * Set points
     *
     * @param integer $points
     *
     * @return User
     */
    public function setPoints($points)
    {
        $this->points = $points;

        return $this;
    }

    /**
     * Get points
     *
     * @return integer
     */
    public function getPoints()
    {
        return $this->points;
    }

    /**
     * Set phone
     *
     * @param string $phone
     *
     * @return User
     */
    public function setPhone($phone)
    {
        $this->phone = $phone;

        return $this;
    }

    /**
     * Get phone
     *
     * @return string
     */
    public function getPhone()
    {
        return $this->phone;
    }

    /**
     * Set realname
     *
     * @param string $realname
     *
     * @return User
     */
    public function setRealname($realname)
    {
        $this->realname = $realname;

        return $this;
    }

    /**
     * Get realname
     *
     * @return string
     */
    public function getRealname()
    {
        return $this->realname;
    }

    /**
     * Set city
     *
     * @param string $city
     *
     * @return User
     */
    public function setCity($city)
    {
        $this->city = $city;

        return $this;
    }

    /**
     * Get city
     *
     * @return string
     */
    public function getCity()
    {
        return $this->city;
    }

    /**
     * Set cap
     *
     * @param string $cap
     *
     * @return User
     */
    public function setCap($cap)
    {
        $this->cap = $cap;

        return $this;
    }

    /**
     * Get cap
     *
     * @return string
     */
    public function getCap()
    {
        return $this->cap;
    }

    /**
     * Set code
     *
     * @param string $code
     *
     * @return User
     */
    public function setCode($code)
    {
        $this->code = $code;

        return $this;
    }

    /**
     * Get code
     *
     * @return string
     */
    public function getCode()
    {
        return $this->code;
    }

    /**
     * Set creditsGold
     *
     * @param integer $creditsGold
     *
     * @return User
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
     * @return User
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
     * @return User
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
     * Set name
     *
     * @param string $name
     *
     * @return User
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
     * Set facebookId
     *
     * @param string $facebookId
     *
     * @return User
     */
    public function setFacebookId($facebookId)
    {
        $this->facebook_id = $facebookId;

        return $this;
    }

    /**
     * Get facebookId
     *
     * @return string
     */
    public function getFacebookId()
    {
        return $this->facebook_id;
    }

    /**
     * Set facebookAccessToken
     *
     * @param string $facebookAccessToken
     *
     * @return User
     */
    public function setFacebookAccessToken($facebookAccessToken)
    {
        $this->facebook_access_token = $facebookAccessToken;

        return $this;
    }

    /**
     * Get facebookAccessToken
     *
     * @return string
     */
    public function getFacebookAccessToken()
    {
        return $this->facebook_access_token;
    }

    /**
     * Set googleId
     *
     * @param string $googleId
     *
     * @return User
     */
    public function setGoogleId($googleId)
    {
        $this->google_id = $googleId;

        return $this;
    }

    /**
     * Get googleId
     *
     * @return string
     */
    public function getGoogleId()
    {
        return $this->google_id;
    }

    /**
     * Set googleAccessToken
     *
     * @param string $googleAccessToken
     *
     * @return User
     */
    public function setGoogleAccessToken($googleAccessToken)
    {
        $this->google_access_token = $googleAccessToken;

        return $this;
    }

    /**
     * Get googleAccessToken
     *
     * @return string
     */
    public function getGoogleAccessToken()
    {
        return $this->google_access_token;
    }

    /**
     * Set pic
     *
     * @param string $pic
     *
     * @return User
     */
    public function setPic($pic)
    {
        $this->pic = $pic;

        return $this;
    }

    /**
     * Get pic
     *
     * @return string
     */
    public function getPic()
    {
        return $this->pic;
    }

    /**
     * Set isCompany.
     *
     * @param int|null $isCompany
     *
     * @return User
     */
    public function setIsCompany($isCompany = null)
    {
        $this->isCompany = $isCompany;

        return $this;
    }

    /**
     * Get isCompany.
     *
     * @return int|null
     */
    public function getIsCompany()
    {
        return $this->isCompany;
    }

    /**
     * Set companyLogo.
     *
     * @param string|null $companyLogo
     *
     * @return User
     */
    public function setCompanyLogo($companyLogo = null)
    {
        $this->companyLogo = $companyLogo;

        return $this;
    }

    /**
     * Get companyLogo.
     *
     * @return string|null
     */
    public function getCompanyLogo()
    {
        return $this->companyLogo;
    }

    /**
     * Set companyWebsite.
     *
     * @param string|null $companyWebsite
     *
     * @return User
     */
    public function setCompanyWebsite($companyWebsite = null)
    {
        $this->companyWebsite = $companyWebsite;

        return $this;
    }

    /**
     * Get companyWebsite.
     *
     * @return string|null
     */
    public function getCompanyWebsite()
    {
        return $this->companyWebsite;
    }

    /**
     * Set businessEnd.
     *
     * @param \DateTime|null $businessEnd
     *
     * @return User
     */
    public function setBusinessEnd($businessEnd = null)
    {
        $this->businessEnd = $businessEnd;

        return $this;
    }

    /**
     * Get businessEnd.
     *
     * @return \DateTime|null
     */
    public function getBusinessEnd()
    {
        return $this->businessEnd;
    }
}

<?php
namespace AppBundle\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\AdvancedUserInterface;


/**
 * @ORM\Entity
 * @ORM\Table(name="users")
 */
class User implements AdvancedUserInterface, \Serializable
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
     * @ORM\Column(type="string")
     */
    private $email;
    
    /**
     * @ORM\Column(type="string")
     */
    private $password;
    
    /**
     * @ORM\Column(type="date")
     */
    private $datejoin;
    
    /**
     * @ORM\Column(name="is_active", type="boolean")
     */
    private $isActive;
    
    /**
     * @ORM\Column(type="string")
     */
    private $address;
    
    /**
     * @ORM\Column(type="integer")
     */
    private $points;
    /**
     * @ORM\Column(type="string")
     * @ORM\ManyToMany(targetEntity="Role", inversedBy="users")
     */
    private $roles;
    
    /**
     * @ORM\Column(type="string")
     */
    private $phone;

    /**
     * @ORM\Column(type="string")
     */
    private $username;

    /**
     * @ORM\Column(type="string")
     */
    private $realname;

    /**
     * @ORM\Column(type="string")
     */
    private $city;

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
    private $credits_gold;

    /**
     * @ORM\Column(type="integer")
     */

    private $credits_silver;
    /**
     * @ORM\Column(type="integer")
     */
    private $credits_bronze;

    public function getSalt()
    {
        return null;
    }

    public function __construct()
    {
        $this->role = new ArrayCollection();
    }

    public function eraseCredentials()
    {
    }

    public function isAccountNonExpired()
    {
        return true;
    }

    public function isAccountNonLocked()
    {
        return true;
    }

    public function isCredentialsNonExpired()
    {
        return true;
    }

    public function isEnabled()
    {
        return $this->isActive;
    }

    public function serialize()
    {
        return serialize(array(
            $this->id,
            $this->isActive
        ));
    }
    public function unserialize($serialized)
    {
        list (
            $this->id,
            $this->isActive
        ) = unserialize($serialized);
    }

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
     * Set email
     *
     * @param string $email
     *
     * @return User
     */
    public function setEmail($email)
    {
        $this->email = $email;

        return $this;
    }

    /**
     * Get email
     *
     * @return string
     */
    public function getEmail()
    {
        return $this->email;
    }

    /**
     * Set password
     *
     * @param string $password
     *
     * @return User
     */
    public function setPassword($password)
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Get password
     *
     * @return mixed
     */

    public function getPassword()
    {
        return $this->password;
    }

    /**
     * Set datejoin
     *
     * @param DateTime $datejoin
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
     * @return DateTime
     */
    public function getDatejoin()
    {
        return $this->datejoin;
    }

    /**
     * Set isActive
     *
     * @param boolean $isActive
     *
     * @return User
     */
    public function setIsActive($isActive)
    {
        $this->isActive = $isActive;

        return $this;
    }

    /**
     * Get isActive
     *
     * @return boolean
     */
    public function getIsActive()
    {
        return $this->isActive;
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
     * Get role
     *
     * @return array
     */
    public function getRoles()
    {
        return array($this->roles);
    }

    /**
     * Set role
     *
     * @param string $role
     *
     * @return User
     */
    public function setRoles($roles)
    {
        $this->roles = $roles;

        return $this;
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
     * Set username
     *
     * @param string $username
     *
     * @return User
     */
    public function setUsername($username)
    {
        $this->username = $username;

        return $this;
    }

    /**
     * Get username
     *
     * @return mixed
     */

    public function getUsername()
    {
        return $this->username;
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

}

<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * BusinessRequests
 *
 * @ORM\Table(name="business_requests")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\BusinessRequestsRepository")
 *
 */
class BusinessRequests
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
     * @var int
     *
     * @ORM\Column(name="uid", type="integer")
     */
    private $uid;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="requestDate", type="datetime")
     */
    private $requestDate;

    /**
     * @var boolean
     *
     * @ORM\Column(name="paid", type="boolean")
     */
    private $paid;

    /**
     * @var int
     *
     * @ORM\Column(name="package", type="integer")
     */
    private $package;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt1", type="boolean")
     */
    private $opt1;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt2", type="boolean")
     */
    private $opt2;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt3", type="boolean")
     */
    private $opt3;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt4", type="boolean")
     */
    private $opt4;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt5", type="boolean")
     */
    private $opt5;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt6", type="boolean")
     */
    private $opt6;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt7", type="boolean")
     */
    private $opt7;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt8", type="boolean")
     */
    private $opt8;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt9", type="boolean")
     */
    private $opt9;

    /**
     * @var boolean
     *
     * @ORM\Column(name="opt10", type="boolean")
     */
    private $opt10;

    /**
     * @var string
     *
     * @ORM\Column(name="legalName", type="string")
     */
    private $legalName;

    /**
     * @var integer;
     *
     * @ORM\Column(name="vatNumber", type="integer")
     */
    private $vatNumber;

    /**
     * @var string
     *
     * @ORM\Column(name="contactName", type="string")
     */
    private $contactName;

    /**
     * @var string
     *
     * @ORM\Column(name="contactSurname", type="string")
     */
    private $contactSurname;

    /**
     * @var string
     *
     * @ORM\Column(name="contactPhone", type="string")
     */
    private $contactPhone;

    /**
     * @var string
     *
     * @ORM\Column(name="contactEmail", type="string")
     */
    private $contactEmail;


    /**
     * Get id.
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set uid.
     *
     * @param int $uid
     *
     * @return BusinessRequests
     */
    public function setUid($uid)
    {
        $this->uid = $uid;

        return $this;
    }

    /**
     * Get uid.
     *
     * @return int
     */
    public function getUid()
    {
        return $this->uid;
    }

    /**
     * Set requestDate.
     *
     * @param \DateTime $requestDate
     *
     * @return BusinessRequests
     */
    public function setRequestDate($requestDate)
    {
        $this->requestDate = $requestDate;

        return $this;
    }

    /**
     * Get requestDate.
     *
     * @return \DateTime
     */
    public function getRequestDate()
    {
        return $this->requestDate;
    }

    /**
     * Set paid.
     *
     * @param bool $paid
     *
     * @return BusinessRequests
     */
    public function setPaid($paid)
    {
        $this->paid = $paid;

        return $this;
    }

    /**
     * Get paid.
     *
     * @return bool
     */
    public function getPaid()
    {
        return $this->paid;
    }

    /**
     * Set package.
     *
     * @param int $package
     *
     * @return BusinessRequests
     */
    public function setPackage($package)
    {
        $this->package = $package;

        return $this;
    }

    /**
     * Get package.
     *
     * @return int
     */
    public function getPackage()
    {
        return $this->package;
    }

    /**
     * Set opt1.
     *
     * @param bool $opt1
     *
     * @return BusinessRequests
     */
    public function setOpt1($opt1)
    {
        $this->opt1 = $opt1;

        return $this;
    }

    /**
     * Get opt1.
     *
     * @return bool
     */
    public function getOpt1()
    {
        return $this->opt1;
    }

    /**
     * Set opt2.
     *
     * @param bool $opt2
     *
     * @return BusinessRequests
     */
    public function setOpt2($opt2)
    {
        $this->opt2 = $opt2;

        return $this;
    }

    /**
     * Get opt2.
     *
     * @return bool
     */
    public function getOpt2()
    {
        return $this->opt2;
    }

    /**
     * Set opt3.
     *
     * @param bool $opt3
     *
     * @return BusinessRequests
     */
    public function setOpt3($opt3)
    {
        $this->opt3 = $opt3;

        return $this;
    }

    /**
     * Get opt3.
     *
     * @return bool
     */
    public function getOpt3()
    {
        return $this->opt3;
    }

    /**
     * Set opt4.
     *
     * @param bool $opt4
     *
     * @return BusinessRequests
     */
    public function setOpt4($opt4)
    {
        $this->opt4 = $opt4;

        return $this;
    }

    /**
     * Get opt4.
     *
     * @return bool
     */
    public function getOpt4()
    {
        return $this->opt4;
    }

    /**
     * Set opt5.
     *
     * @param bool $opt5
     *
     * @return BusinessRequests
     */
    public function setOpt5($opt5)
    {
        $this->opt5 = $opt5;

        return $this;
    }

    /**
     * Get opt5.
     *
     * @return bool
     */
    public function getOpt5()
    {
        return $this->opt5;
    }

    /**
     * Set opt6.
     *
     * @param bool $opt6
     *
     * @return BusinessRequests
     */
    public function setOpt6($opt6)
    {
        $this->opt6 = $opt6;

        return $this;
    }

    /**
     * Get opt6.
     *
     * @return bool
     */
    public function getOpt6()
    {
        return $this->opt6;
    }

    /**
     * Set opt7.
     *
     * @param bool $opt7
     *
     * @return BusinessRequests
     */
    public function setOpt7($opt7)
    {
        $this->opt7 = $opt7;

        return $this;
    }

    /**
     * Get opt7.
     *
     * @return bool
     */
    public function getOpt7()
    {
        return $this->opt7;
    }

    /**
     * Set opt8.
     *
     * @param bool $opt8
     *
     * @return BusinessRequests
     */
    public function setOpt8($opt8)
    {
        $this->opt8 = $opt8;

        return $this;
    }

    /**
     * Get opt8.
     *
     * @return bool
     */
    public function getOpt8()
    {
        return $this->opt8;
    }

    /**
     * Set opt9.
     *
     * @param bool $opt9
     *
     * @return BusinessRequests
     */
    public function setOpt9($opt9)
    {
        $this->opt9 = $opt9;

        return $this;
    }

    /**
     * Get opt9.
     *
     * @return bool
     */
    public function getOpt9()
    {
        return $this->opt9;
    }

    /**
     * Set opt10.
     *
     * @param bool $opt10
     *
     * @return BusinessRequests
     */
    public function setOpt10($opt10)
    {
        $this->opt10 = $opt10;

        return $this;
    }

    /**
     * Get opt10.
     *
     * @return bool
     */
    public function getOpt10()
    {
        return $this->opt10;
    }

    /**
     * Set legalName.
     *
     * @param string $legalName
     *
     * @return BusinessRequests
     */
    public function setLegalName($legalName)
    {
        $this->legalName = $legalName;

        return $this;
    }

    /**
     * Get legalName.
     *
     * @return string
     */
    public function getLegalName()
    {
        return $this->legalName;
    }

    /**
     * Set vatNumber.
     *
     * @param int $vatNumber
     *
     * @return BusinessRequests
     */
    public function setVatNumber($vatNumber)
    {
        $this->vatNumber = $vatNumber;

        return $this;
    }

    /**
     * Get vatNumber.
     *
     * @return int
     */
    public function getVatNumber()
    {
        return $this->vatNumber;
    }

    /**
     * Set contactName.
     *
     * @param string $contactName
     *
     * @return BusinessRequests
     */
    public function setContactName($contactName)
    {
        $this->contactName = $contactName;

        return $this;
    }

    /**
     * Get contactName.
     *
     * @return string
     */
    public function getContactName()
    {
        return $this->contactName;
    }

    /**
     * Set contactSurname.
     *
     * @param string $contactSurname
     *
     * @return BusinessRequests
     */
    public function setContactSurname($contactSurname)
    {
        $this->contactSurname = $contactSurname;

        return $this;
    }

    /**
     * Get contactSurname.
     *
     * @return string
     */
    public function getContactSurname()
    {
        return $this->contactSurname;
    }

    /**
     * Set contactPhone.
     *
     * @param string $contactPhone
     *
     * @return BusinessRequests
     */
    public function setContactPhone($contactPhone)
    {
        $this->contactPhone = $contactPhone;

        return $this;
    }

    /**
     * Get contactPhone.
     *
     * @return string
     */
    public function getContactPhone()
    {
        return $this->contactPhone;
    }

    /**
     * Set contactEmail.
     *
     * @param string $contactEmail
     *
     * @return BusinessRequests
     */
    public function setContactEmail($contactEmail)
    {
        $this->contactEmail = $contactEmail;

        return $this;
    }

    /**
     * Get contactEmail.
     *
     * @return string
     */
    public function getContactEmail()
    {
        return $this->contactEmail;
    }
}

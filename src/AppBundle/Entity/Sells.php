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
 * @ORM\Table(name="sells")
 */
class Sells
{
    /**
     * @ORM\Column (type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column (type="integer")
     */
    private $fuid;

    /**
     * @ORM\Column (type="integer")
     */
    private $tuid;

    /**
     * @ORM\Column (type="integer")
     */
    private $aid;

    /**
     * @ORM\Column (type="integer")
     */
    private $status;

    /**
     * @ORM\Column (type="integer")
     */
    private $verified;

    /**
     * @ORM\Column (type="integer")
     */
    private $shipped;

    /**
     * @ORM\Column (type="integer")
     */
    private $feedout;

    /**
     * @ORM\Column (type="integer")
     */
    private $feedin;

    /**
     * @ORM\Column (type="integer")
     */
    private $type;

    /**
     * @ORM\Column (type="integer")
     */
    private $paid;

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
     * Set fuid
     *
     * @param integer $fuid
     *
     * @return Sells
     */
    public function setFuid($fuid)
    {
        $this->fuid = $fuid;

        return $this;
    }

    /**
     * Get fuid
     *
     * @return integer
     */
    public function getFuid()
    {
        return $this->fuid;
    }

    /**
     * Set tuid
     *
     * @param integer $tuid
     *
     * @return Sells
     */
    public function setTuid($tuid)
    {
        $this->tuid = $tuid;

        return $this;
    }

    /**
     * Get tuid
     *
     * @return integer
     */
    public function getTuid()
    {
        return $this->tuid;
    }

    /**
     * Set ouid
     *
     * @param integer $ouid
     *
     * @return Sells
     */
    public function setOuid($ouid)
    {
        $this->ouid = $ouid;

        return $this;
    }

    /**
     * Get ouid
     *
     * @return integer
     */
    public function getOuid()
    {
        return $this->ouid;
    }

    /**
     * Set status
     *
     * @param integer $status
     *
     * @return Sells
     */
    public function setStatus($status)
    {
        $this->status = $status;

        return $this;
    }

    /**
     * Get status
     *
     * @return integer
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * Set verified
     *
     * @param integer $verified
     *
     * @return Sells
     */
    public function setVerified($verified)
    {
        $this->verified = $verified;

        return $this;
    }

    /**
     * Get verified
     *
     * @return integer
     */
    public function getVerified()
    {
        return $this->verified;
    }

    /**
     * Set aid
     *
     * @param integer $aid
     *
     * @return Sells
     */
    public function setAid($aid)
    {
        $this->aid = $aid;

        return $this;
    }

    /**
     * Get aid
     *
     * @return integer
     */
    public function getAid()
    {
        return $this->aid;
    }

    /**
     * Set shipped
     *
     * @param integer $shipped
     *
     * @return Sells
     */
    public function setShipped($shipped)
    {
        $this->shipped = $shipped;

        return $this;
    }

    /**
     * Get shipped
     *
     * @return integer
     */
    public function getShipped()
    {
        return $this->shipped;
    }

    /**
     * Set feedout
     *
     * @param integer $feedout
     *
     * @return Sells
     */
    public function setFeedout($feedout)
    {
        $this->feedout = $feedout;

        return $this;
    }

    /**
     * Get feedout
     *
     * @return integer
     */
    public function getFeedout()
    {
        return $this->feedout;
    }

    /**
     * Set feedin
     *
     * @param integer $feedin
     *
     * @return Sells
     */
    public function setFeedin($feedin)
    {
        $this->feedin = $feedin;

        return $this;
    }

    /**
     * Get feedin
     *
     * @return integer
     */
    public function getFeedin()
    {
        return $this->feedin;
    }

    /**
     * Set type
     *
     * @param integer $type
     *
     * @return Sells
     */
    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return integer
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Set paid
     *
     * @param integer $paid
     *
     * @return Sells
     */
    public function setPaid($paid)
    {
        $this->paid = $paid;

        return $this;
    }

    /**
     * Get paid
     *
     * @return integer
     */
    public function getPaid()
    {
        return $this->paid;
    }
}

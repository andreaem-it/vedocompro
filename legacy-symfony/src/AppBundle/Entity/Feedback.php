<?php
namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="feedback")
 */
class Feedback
{
    /**
     * @ORM\Column(type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;
    
    /**
     * @ORM\Column(type="integer")
     */
    private $uid;
    
    /**
     * @ORM\Column(type="integer")
     */
     private $fromuid;
    
    /**
     * @ORM\Column(type="integer")
     */
    private $vote;
    
    /**
     * @ORM\Column(type="string")
     */
    private $description;
    
    /**
     * @ORM\Column(type="integer")
     */
    private $positive;
    
    /**
     * @ORM\Column(type="datetime")
     */
    private $datetime;
    
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
     * Set uid
     *
     * @param integer $uid
     *
     * @return Feedback
     */
    public function setUid($uid)
    {
        $this->uid = $uid;

        return $this;
    }

    /**
     * Get uid
     *
     * @return integer
     */
    public function getUid()
    {
        return $this->uid;
    }

    /**
     * Set fromuid
     *
     * @param integer $fromuid
     *
     * @return Feedback
     */
    public function setFromuid($fromuid)
    {
        $this->fromuid = $fromuid;

        return $this;
    }

    /**
     * Get fromuid
     *
     * @return integer
     */
    public function getFromuid()
    {
        return $this->fromuid;
    }

    /**
     * Set vote
     *
     * @param integer $vote
     *
     * @return Feedback
     */
    public function setVote($vote)
    {
        $this->vote = $vote;

        return $this;
    }

    /**
     * Get vote
     *
     * @return integer
     */
    public function getVote()
    {
        return $this->vote;
    }

    /**
     * Set description
     *
     * @param string $description
     *
     * @return Feedback
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
     * Set positive
     *
     * @param integer $positive
     *
     * @return Feedback
     */
    public function setPositive($positive)
    {
        $this->positive = $positive;

        return $this;
    }

    /**
     * Get positive
     *
     * @return integer
     */
    public function getPositive()
    {
        return $this->positive;
    }

    /**
     * Set datetime
     *
     * @param \DateTime $datetime
     *
     * @return Feedback
     */
    public function setDatetime($datetime)
    {
        $this->datetime = $datetime;

        return $this;
    }

    /**
     * Get datetime
     *
     * @return \DateTime
     */
    public function getDatetime()
    {
        return $this->datetime;
    }
}

<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * HelpDesk
 *
 * @ORM\Table(name="help_desk")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\HelpDeskRepository")
 */
class HelpDesk
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
     * @var int
     *
     * @ORM\Column(name="type", type="integer")
     */
    private $type;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="timest", type="datetime")
     */
    private $timest;

    /**
     * @var string
     *
     * @ORM\Column(name="isReply", type="boolean")
     */
    private $isReply;

    /**
     * @var String
     *
     * @ORM\Column(name="replyTo", type="integer")
     */
    private $replyTo;

    /**
     * @var int
     *
     * @ORM\Column(name="parent_m", type="integer")
     */
    private $parent_m;

    /**
     * @var string
     *
     * @ORM\Column(name="title", type="string")
     */
    private $title;

    /**
     * @var string
     *
     * @ORM\Column(name="message", type="string")
     */
    private $message;

    /**
     * @var boolean
     *
     * @ORM\Column(name="closed", type="boolean")
     */
    private $closed;

    /**
     * @var int
     *
     * @ORM\Column(name="assignedTo", type="integer")
     */
    private $assignedTo;

    /**
     * Get id
     *
     * @return int
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
     * @return HelpDesk
     */
    public function setUid($uid)
    {
        $this->uid = $uid;

        return $this;
    }

    /**
     * Get uid
     *
     * @return int
     */
    public function getUid()
    {
        return $this->uid;
    }

    /**
     * Set type
     *
     * @param integer $type
     *
     * @return HelpDesk
     */
    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return int
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Set timest
     *
     * @param \DateTime $timest
     *
     * @return HelpDesk
     */
    public function setTimest($timest)
    {
        $this->timest = $timest;

        return $this;
    }

    /**
     * Get timest
     *
     * @return \DateTime
     */
    public function getTimest()
    {
        return $this->timest;
    }

    /**
     * Set isReply
     *
     * @param string $isReply
     *
     * @return HelpDesk
     */
    public function setIsReply($isReply)
    {
        $this->isReply = $isReply;

        return $this;
    }

    /**
     * Get isReply
     *
     * @return string
     */
    public function getIsReply()
    {
        return $this->isReply;
    }

    /**
     * Set parentM
     *
     * @param integer $parentM
     *
     * @return HelpDesk
     */
    public function setParentM($parentM)
    {
        $this->parent_m = $parentM;

        return $this;
    }

    /**
     * Get parentM
     *
     * @return integer
     */
    public function getParentM()
    {
        return $this->parent_m;
    }

    /**
     * Set message
     *
     * @param string $message
     *
     * @return HelpDesk
     */
    public function setMessage($message)
    {
        $this->message = $message;

        return $this;
    }

    /**
     * Get message
     *
     * @return string
     */
    public function getMessage()
    {
        return $this->message;
    }

    /**
     * Set closed
     *
     * @param boolean $closed
     *
     * @return HelpDesk
     */
    public function setClosed($closed)
    {
        $this->closed = $closed;

        return $this;
    }

    /**
     * Get closed
     *
     * @return boolean
     */
    public function getClosed()
    {
        return $this->closed;
    }

    /**
     * Set title
     *
     * @param string $title
     *
     * @return HelpDesk
     */
    public function setTitle($title)
    {
        $this->title = $title;

        return $this;
    }

    /**
     * Get title
     *
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * Set replyTo
     *
     * @param integer $replyTo
     *
     * @return HelpDesk
     */
    public function setReplyTo($replyTo)
    {
        $this->replyTo = $replyTo;

        return $this;
    }

    /**
     * Get replyTo
     *
     * @return integer
     */
    public function getReplyTo()
    {
        return $this->replyTo;
    }

    /**
     * Set assignedTo
     *
     * @param integer $parentM
     *
     * @return HelpDesk
     */
    public function setAssignedTo($assignedTo)
    {
        $this->assigned_to = $assignedTo;

        return $this;
    }

    /**
     * Get assignedTo
     *
     * @return integer
     */
    public function getAssignedTo()
    {
        return $this->assigned_to;
    }
}

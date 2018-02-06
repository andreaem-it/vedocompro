<?php
namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="messages")
 */
class Messages
{
    /**
    * @ORM\Column (type="integer")
    * @ORM\Id
    * @ORM\GeneratedValue(strategy="AUTO")
    **/
    private $id;
    /**
     * @ORM\Column (type="integer")
     */
    private $fromUID;
    /**
     * @ORM\Column (type="integer")
     */
    private $toUID;
    /**
     * @ORM\Column (type="datetime")
     */
    private $datetime;
    /**
     * @ORM\Column (type="string")
     */
    private $message;
    /**
     * @ORM\Column (type="integer")
     */
    private $isRead;
    /**
<<<<<<< HEAD
     * @ORM\Column (type="boolean")
     */
    private $canReply = true;
    /**
=======
>>>>>>> restyle
     * @ORM\Column (type="integer")
     */
    private $object;

    /**
     * Get id
     *
     * @return \Integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set fromUID
     *
     * @param integer $fromUID
     *
     * @return Messages
     */
    public function setFromUID($fromUID)
    {
        $this->fromUID = $fromUID;

        return $this;
    }

    /**
     * Get fromUID
     *
     * @return integer
     */
    public function getFromUID()
    {
        return $this->fromUID;
    }

    /**
     * Set toUID
     *
     * @param integer $toUID
     *
     * @return Messages
     */
    public function setToUID($toUID)
    {
        $this->toUID = $toUID;

        return $this;
    }

    /**
     * Get toUID
     *
     * @return integer
     */
    public function getToUID()
    {
        return $this->toUID;
    }

    /**
     * Set datetime
     *
     * @param \DateTime $datetime
     *
     * @return Messages
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

    /**
     * Set message
     *
     * @param string $message
     *
     * @return Messages
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
     * Set isRead
     *
     * @param integer $isRead
     *
     * @return Messages
     */
    public function setIsRead($isRead)
    {
        $this->isRead = $isRead;

        return $this;
    }

    /**
     * Get isRead
     *
     * @return integer
     */
    public function getIsRead()
    {
        return $this->isRead;
    }

    /**
     * Set object
     *
     * @param integer $object
     *
     * @return Messages
     */
    public function setObject($object)
    {
        $this->object = $object;

        return $this;
    }

    /**
     * Get object
     *
     * @return integer
     */
    public function getObject()
    {
        return $this->object;
    }

    /**
     * Set canReply
     *
     * @param boolean $canReply
     *
     * @return Messages
     */
    public function setCanReply($canReply)
    {
        $this->canReply = $canReply;

        return $this;
    }

    /**
     * Get canReply
     *
     * @return boolean
     */
    public function getCanReply()
    {
        return $this->canReply;
    }
}

<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * AdminActions
 *
 * @ORM\Table(name="admin_actions")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\AdminActionsRepository")
 */
class AdminActions
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
     * @var \DateTime
     *
     * @ORM\Column(name="linedate", type="datetime")
     */
    private $linedate;

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
     * Get id
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set linedate
     *
     * @param \DateTime $linedate
     *
     * @return AdminActions
     */
    public function setLinedate($linedate)
    {
        $this->linedate = $linedate;

        return $this;
    }

    /**
     * Get linedate
     *
     * @return \DateTime
     */
    public function getLinedate()
    {
        return $this->linedate;
    }

    /**
     * Set uid
     *
     * @param integer $uid
     *
     * @return AdminActions
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
     * @return AdminActions
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
}


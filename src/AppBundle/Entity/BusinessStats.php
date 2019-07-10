<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * BusinessStats
 *
 * @ORM\Table(name="business_stats")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\BusinessStatsRepository")
 *
 */
class BusinessStats
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
     * @ORM\Column(name="datetime", type="datetime")
     */
    private $datetime;

    /**
     * @var int
     *
     * @ORM\Column(name="adid", type="integer")
     */
    private $adid;

    /**
     * @var int
     *
     * @ORM\Column(name="type", type="integer")
     */
    private $type;


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
     * @return BusinessStats
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
     * Set datetime.
     *
     * @param \DateTime $datetime
     *
     * @return BusinessStats
     */
    public function setDatetime($datetime)
    {
        $this->datetime = $datetime;

        return $this;
    }

    /**
     * Get datetime.
     *
     * @return \DateTime
     */
    public function getDatetime()
    {
        return $this->datetime;
    }

    /**
     * Set adid.
     *
     * @param int $adid
     *
     * @return BusinessStats
     */
    public function setAdid($adid)
    {
        $this->adid = $adid;

        return $this;
    }

    /**
     * Get adid.
     *
     * @return int
     */
    public function getAdid()
    {
        return $this->adid;
    }

    /**
     * Set type.
     *
     * @param int $type
     *
     * @return BusinessStats
     */
    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get type.
     *
     * @return int
     */
    public function getType()
    {
        return $this->type;
    }
}

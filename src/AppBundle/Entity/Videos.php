<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Videos
 *
 * @ORM\Table(name="videos")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\VideosRepository")
 */
class Videos
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
     * @ORM\Column(name="aid", type="integer")
     */
    private $aid;

    /**
     * @var int
     *
     * @ORM\Column(name="accepted", type="integer")
     */
    private $accepted;

    /**
     * @var int
     *
     * @ORM\Column(name="uid", type="integer")
     */
    private $uid;

    /**
     * @var string
     *
     * @ORM\Column(name="dir", type="string")
     */
    private $dir;

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
     * Set aid
     *
     * @param integer $aid
     *
     * @return Videos
     */
    public function setAid($aid)
    {
        $this->aid = $aid;

        return $this;
    }

    /**
     * Get aid
     *
     * @return int
     */
    public function getAid()
    {
        return $this->aid;
    }

    /**
     * Set accepted
     *
     * @param integer $accepted
     *
     * @return Videos
     */
    public function setAccepted($accepted)
    {
        $this->accepted = $accepted;

        return $this;
    }

    /**
     * Get accepted
     *
     * @return int
     */
    public function getAccepted()
    {
        return $this->accepted;
    }

    /**
     * Set uid
     *
     * @param integer $uid
     *
     * @return Videos
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
     * Set dir
     *
     * @param integer $dir
     *
     * @return Videos
     */
    public function setDir($dir)
    {
        $this->dir = $dir;

        return $this;
    }

    /**
     * Get dir
     *
     * @return integer
     */
    public function getDir()
    {
        return $this->dir;
    }
}

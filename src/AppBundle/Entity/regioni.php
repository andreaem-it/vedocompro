<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * regioni
 *
 * @ORM\Table(name="regioni")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\regioniRepository")
 */
class regioni
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
     * @var string
     *
     * @ORM\Column(name="nome", type="text")
     */
    private $nome;

    /**
     * @var string
     *
     * @ORM\Column(name="latitudine", type="decimal", precision=10, scale=0)
     */
    private $latitudine;

    /**
     * @var string
     *
     * @ORM\Column(name="logitudine", type="decimal", precision=10, scale=0)
     */
    private $logitudine;


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
     * Set nome
     *
     * @param string $nome
     *
     * @return regioni
     */
    public function setNome($nome)
    {
        $this->nome = $nome;

        return $this;
    }

    /**
     * Get nome
     *
     * @return string
     */
    public function getNome()
    {
        return $this->nome;
    }

    /**
     * Set latitudine
     *
     * @param string $latitudine
     *
     * @return regioni
     */
    public function setLatitudine($latitudine)
    {
        $this->latitudine = $latitudine;

        return $this;
    }

    /**
     * Get latitudine
     *
     * @return string
     */
    public function getLatitudine()
    {
        return $this->latitudine;
    }

    /**
     * Set logitudine
     *
     * @param string $logitudine
     *
     * @return regioni
     */
    public function setLogitudine($logitudine)
    {
        $this->logitudine = $logitudine;

        return $this;
    }

    /**
     * Get logitudine
     *
     * @return string
     */
    public function getLogitudine()
    {
        return $this->logitudine;
    }
}


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
     * @ORM\Column(name="longitudine", type="decimal", precision=10, scale=0)
     */
    private $longitudine;


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
     * Set longitudine
     *
     * @param string $longitudine
     *
     * @return regioni
     */
    public function setLongitudine($longitudine)
    {
        $this->longitudine = $longitudine;

        return $this;
    }

    /**
     * Get longitudine
     *
     * @return string
     */
    public function getLongitudine()
    {
        return $this->longitudine;
    }

    public function __toString() {
        return (string) $this->nome;
    }
}


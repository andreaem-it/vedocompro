<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * comuni
 *
 * @ORM\Table(name="comuni")
 * @ORM\Entity(repositoryClass="AppBundle\Repository\comuniRepository")
 */
class comuni
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
     * @ORM\Column(name="id_regione", type="integer")
     */
    private $idRegione;

    /**
     * @var int
     *
     * @ORM\Column(name="id_provincia", type="integer")
     */
    private $idProvincia;

    /**
     * @var string
     *
     * @ORM\Column(name="nome", type="text")
     */
    private $nome;

    /**
     * @var int
     *
     * @ORM\Column(name="capoluogo_provincia", type="integer")
     */
    private $capoluogoProvincia;

    /**
     * @var string
     *
     * @ORM\Column(name="codice_catastale", type="text")
     */
    private $codiceCatastale;

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

    public function __toString()
    {
        return $this->getNome();
    }

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
     * Set idRegione
     *
     * @param integer $idRegione
     *
     * @return comuni
     */
    public function setIdRegione($idRegione)
    {
        $this->idRegione = $idRegione;

        return $this;
    }

    /**
     * Get idRegione
     *
     * @return int
     */
    public function getIdRegione()
    {
        return $this->idRegione;
    }

    /**
     * Set idProvincia
     *
     * @param integer $idProvincia
     *
     * @return comuni
     */
    public function setIdProvincia($idProvincia)
    {
        $this->idProvincia = $idProvincia;

        return $this;
    }

    /**
     * Get idProvincia
     *
     * @return int
     */
    public function getIdProvincia()
    {
        return $this->idProvincia;
    }

    /**
     * Set nome
     *
     * @param string $nome
     *
     * @return comuni
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
     * Set capoluogoProvincia
     *
     * @param integer $capoluogoProvincia
     *
     * @return comuni
     */
    public function setCapoluogoProvincia($capoluogoProvincia)
    {
        $this->capoluogoProvincia = $capoluogoProvincia;

        return $this;
    }

    /**
     * Get capoluogoProvincia
     *
     * @return int
     */
    public function getCapoluogoProvincia()
    {
        return $this->capoluogoProvincia;
    }

    /**
     * Set codiceCatastale
     *
     * @param string $codiceCatastale
     *
     * @return comuni
     */
    public function setCodiceCatastale($codiceCatastale)
    {
        $this->codiceCatastale = $codiceCatastale;

        return $this;
    }

    /**
     * Get codiceCatastale
     *
     * @return string
     */
    public function getCodiceCatastale()
    {
        return $this->codiceCatastale;
    }

    /**
     * Set latitudine
     *
     * @param string $latitudine
     *
     * @return comuni
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
     * @return comuni
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
}


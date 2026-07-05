<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * comuni
 *
 * @ORM\Table(name="comuni", indexes={@ORM\Index(name="city_id", columns={"city_id"})})
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
     * @var string
     *
     * @ORM\Column(name="istat", type="string")
     */
    private $istat;

    /**
     * @var string
     *
     * @ORM\Column(name="comune", type="string")
     */
    private $comune;

    /**
     * @var \AppBundle\Entity\province
     *
     * @ORM\ManyToOne(targetEntity="AppBundle\Entity\province")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="city_id", referencedColumnName="id")
     * })
     */
    private $city;

    /**
     * @var string
     *
     * @ORM\Column(name="regione", type="string")
     */
    private $regione;

    /**
     * @var string
     *
     * @ORM\Column(name="provincia", type="string")
     */
    private $provincia;

    /**
     * @var int
     *
     * @ORM\Column(name="prefisso", type="integer")
     */
    private $prefisso;

    /**
     * @var string
     *
     * @ORM\Column(name="cod_fisco", type="string")
     */
    private $codFisco;

    /**
     * @var string
     *
     * @ORM\Column(name="superficie", type="decimal", precision=2, scale=0)
     */
    private $superficie;

    /**
     * @var int
     *
     * @ORM\Column(name="num_residenti", type="integer")
     */
    private $numResidenti;

    public function __toString()
    {
        return $this->getComune();
    }


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
     * Set istat.
     *
     * @param string $istat
     *
     * @return comuni
     */
    public function setIstat($istat)
    {
        $this->istat = $istat;

        return $this;
    }

    /**
     * Get istat.
     *
     * @return string
     */
    public function getIstat()
    {
        return $this->istat;
    }

    /**
     * Set comune.
     *
     * @param string $comune
     *
     * @return comuni
     */
    public function setComune($comune)
    {
        $this->comune = $comune;

        return $this;
    }

    /**
     * Get comune.
     *
     * @return string
     */
    public function getComune()
    {
        return $this->comune;
    }

    /**
     * Set regione.
     *
     * @param string $regione
     *
     * @return comuni
     */
    public function setRegione($regione)
    {
        $this->regione = $regione;

        return $this;
    }

    /**
     * Get regione.
     *
     * @return string
     */
    public function getRegione()
    {
        return $this->regione;
    }

    /**
     * Set provincia.
     *
     * @param string $provincia
     *
     * @return comuni
     */
    public function setProvincia($provincia)
    {
        $this->provincia = $provincia;

        return $this;
    }

    /**
     * Get provincia.
     *
     * @return string
     */
    public function getProvincia()
    {
        return $this->provincia;
    }

    /**
     * Set prefisso.
     *
     * @param int $prefisso
     *
     * @return comuni
     */
    public function setPrefisso($prefisso)
    {
        $this->prefisso = $prefisso;

        return $this;
    }

    /**
     * Get prefisso.
     *
     * @return int
     */
    public function getPrefisso()
    {
        return $this->prefisso;
    }

    /**
     * Set codFisco.
     *
     * @param string $codFisco
     *
     * @return comuni
     */
    public function setCodFisco($codFisco)
    {
        $this->codFisco = $codFisco;

        return $this;
    }

    /**
     * Get codFisco.
     *
     * @return string
     */
    public function getCodFisco()
    {
        return $this->codFisco;
    }

    /**
     * Set superficie.
     *
     * @param string $superficie
     *
     * @return comuni
     */
    public function setSuperficie($superficie)
    {
        $this->superficie = $superficie;

        return $this;
    }

    /**
     * Get superficie.
     *
     * @return string
     */
    public function getSuperficie()
    {
        return $this->superficie;
    }

    /**
     * Set numResidenti.
     *
     * @param int $numResidenti
     *
     * @return comuni
     */
    public function setNumResidenti($numResidenti)
    {
        $this->numResidenti = $numResidenti;

        return $this;
    }

    /**
     * Get numResidenti.
     *
     * @return int
     */
    public function getNumResidenti()
    {
        return $this->numResidenti;
    }

    /**
     * Set city.
     *
     * @param \AppBundle\Entity\province|null $city
     *
     * @return comuni
     */
    public function setCity(\AppBundle\Entity\province $city = null)
    {
        $this->city = $city;

        return $this;
    }

    /**
     * Get city.
     *
     * @return \AppBundle\Entity\province|null
     */
    public function getCity()
    {
        return $this->city;
    }
}

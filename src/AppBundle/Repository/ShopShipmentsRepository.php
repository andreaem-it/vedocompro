<?php

namespace AppBundle\Repository;

use AppBundle\Entity\ShopShipments;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;

/**
 * @method ShopShipments|null find($id, $lockMode = null, $lockVersion = null)
 * @method ShopShipments|null findOneBy(array $criteria, array $orderBy = null)
 * @method ShopShipments[]    findAll()
 * @method ShopShipments[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ShopShipmentsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ShopShipments::class);
    }

    // /**
    //  * @return ShopShipments[] Returns an array of ShopShipments objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('s.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?ShopShipments
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}

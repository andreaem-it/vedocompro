<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 16/05/17
 * Time: 13:32
 */
include 'db.config.php';
$DB = new PDO('mysql:host=' . $DB_HOST . ';dbname=' . $DB_NAME,$DB_USER,$DB_PASS);

if(isset($_GET['code'])) {
    $code = $_GET['code'];
    $user = $_GET['uid'];
    $check = $DB->prepare("SELECT * FROM coupons WHERE `code` = '$code' AND `valid` = '1';");
    $check->execute();
    $check = $check->fetch(PDO::FETCH_ASSOC);
    if ($check == null) {
        print 'Il codice inserito non è corretto o è già stato utilizzato';
    } else {
        $statement = $DB->query("UPDATE vedocompro.`coupons` SET coupons.`valid` = 0, coupons.`assigned` = '$user' WHERE `coupons`.`code` = '$code';");
        print 'Codice riscattato con successo! 10 € sono stati aggiunti al tuo account.';
    }
}
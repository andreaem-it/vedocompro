<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 14/05/17
 * Time: 16:07
 */
$characters = 'ABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
$string = '';
$max = strlen($characters) - 1;
$random_string_length = 4;
$string1 = '';
$string2 = '';
for ($i = 0; $i < $random_string_length; $i++) {
    $string1 .= $characters[mt_rand(0, $max)];
}
for ($i = 0; $i < $random_string_length; $i++) {
    $string2 .= $characters[mt_rand(0, $max)];
}

$code = 'VC-' . $string1 . '-' . $string2;

include '../db.config.php';
$DB = new PDO('mysql:host=' . $DB_HOST . ';dbname=' . $DB_NAME,$DB_USER,$DB_PASS);
// Adding code to DB
$value = $_GET['value'];
$statement = $DB->prepare("INSERT INTO coupons(code, value, valid, assigned) VALUES(:code, :value, :valid, '')");
$statement->execute(array("code" => $code,"value" => $value,"valid" => "1"));
// Register Operator Action
$user = $_GET['uid'];
$date = date("Y-m-d H:i:s");;
$statement = $DB->prepare("INSERT INTO admin_actions(linedate, uid, type) VALUES(:linedate, :uid, :type)");
$statement->execute(array("linedate" => $date,"uid" => $user,"type" => "4"));

print $code;
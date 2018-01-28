<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 17/10/17
 * Time: 17:13
 */
require_once 'db.config.php';

if(!empty($_GET["username"])) {
    $DB = new PDO('mysql:host=' . $DB_HOST . ';dbname=' . $DB_NAME, $DB_USER, $DB_PASS);
    $result = $DB->prepare("SELECT count(*) FROM `users` WHERE `name`='" . $_GET["username"] . "';");
    $row = $result->execute()->fetch(PDO::FETCH_ASSOC);
    $user_count = $row[0];

    if ($user_count > 0) {
        echo "<span class='status-not-available'> Username Non disponibile.</span>";
    } else {
        echo "<span class='status-available'> Username Disponibile.</span>";
    }
}
<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 25/07/17
 * Time: 23:52
 */
include 'db.config.php';
$DB = new PDO('mysql:host=' . $DB_HOST . ';dbname=' . $DB_NAME,$DB_USER,$DB_PASS);

$date = date('U');

$put = $DB->prepare("INSERT INTO `suggests` (`id`, `name`, `mail`, `type`, `message`, `date`) VALUES (NULL, :name, :mail, :type, :message, $date);");
$put->bindValue(':name',$_POST['help-panel-form-name']);
$put->bindValue(':mail',$_POST['help-panel-form-email']);
$put->bindValue(':type',$_POST['help-panel-form-type']);
$put->bindValue(':message', $_POST['help-panel-form-message']);
$put->execute();

$message = "Nuovo suggerimento ricevuto!\r\nNome: " . $_POST['help-panel-form-name'] . "\r\nMail: " . $_POST['help-panel-form-email'] . "\r\nTipo: " . $_POST['help-panel-form-type'] . "\r\nMessaggio: " . $_POST['help-panel-form-message'];

$message = wordwrap($message, 70, "\r\n");

mail('info@andreaem.com', 'Feedback sul sito vedocompro.it', $message);

return 'ok';
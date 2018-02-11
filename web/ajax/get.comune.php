<?php
/**
 * Created by PhpStorm.
 * User: andreaemili
 * Date: 09/02/18
 * Time: 16:28
 */
/*header('Content-type: application/json');

$id = $_GET['id'];
$json = '../json/comuni.json';
$json = json_decode(file_get_contents($json), true);

if ($id) {
    for ($i = 0; $i < count($json); $i++) {
        if ($json[$i]['id_provincia'] == $id) {
            $result[] = $json[$i]["nome"];
        }
    }
    if ($result) {
        $result = json_encode($result, JSON_UNESCAPED_UNICODE, JSON_PRETTY_PRINT);
        print_r ($result);
    } else {
        print ('No Results');
    }
} else {
    print ('Error: No ID!');
}*/

$nome = $_GET['nome'];

if ($nome) {
    include 'db.config.php';
    $DB = new PDO('mysql:host=' . $DB_HOST . ';dbname=' . $DB_NAME,$DB_USER,$DB_PASS);

    $DB->query("SET NAMES utf8");

    $nomeProv = $DB->query("SELECT * FROM province WHERE `nome` = '$nome';")->fetchAll();
    $prov = $nomeProv[0]["id"];

    $comuni = $DB->query("SELECT * FROM comuni WHERE `id_provincia` = '$prov';")->fetchAll();

    $lenght = count($comuni);

    print '[';
    for($i = 0; $i < $lenght; $i++) {
        print('{"nome" : "' . $comuni[$i]['nome'] . '"}');
        if ($i != $lenght - 1) {
            print ',';
        }
    }
    print ']';
}

?>
<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
<?php
/**
 * Created by PhpStorm.
 * User: andreaemili
 * Date: 09/02/18
 * Time: 16:28
 */
header('Content-type: application/json');

$query = 'ok';
if ($query == 'ok') {
    $json = '../json/province.json';
    $json = json_decode(file_get_contents($json), true);
    for ( $i = 0; $i < count($json); $i++ ) {
        $result[] = array('id'=> $json[$i]['id'], 'nome'=>$json[$i]["nome"]);
    }
    $result = json_encode($result, JSON_UNESCAPED_UNICODE);
    print_r($result);
} else {
    print ('Error: No Query!');
}
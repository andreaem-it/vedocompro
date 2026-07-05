<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 04/08/17
 * Time: 09:16
 */
require_once '../db.config.php';

$target_dir = "/var/www/html/beta.vedocompro.it/web/temp/";

header('Content-Type: text/plain; charset=utf-8');

try {

    // Undefined | Multiple Files | $_FILES Corruption Attack
    // If this request falls under any of them, treat it invalid.
    if (
        !isset($_FILES['file']['error']) ||
        is_array($_FILES['file']['error'])
    ) {
        throw new RuntimeException('Invalid parameters.');
    }

    // Check $_FILES['file']['error'] value.
    switch ($_FILES['file']['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new RuntimeException('No file sent.');
            break;
        case UPLOAD_ERR_INI_SIZE:
            break;
        case UPLOAD_ERR_FORM_SIZE:
            throw new RuntimeException('Exceeded filesize limit.');
            break;
        default:
            throw new RuntimeException('Unknown errors.');
            break;
    }

    // You should also check filesize here. 
    if ($_FILES['file']['size'] > 209715200) {
        throw new RuntimeException('Exceeded filesize limit.');
    }

    // DO NOT TRUST $_FILES['file']['mime'] VALUE !!
    // Check MIME Type by yourself.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if (false === $ext = array_search(
            $finfo->file($_FILES['file']['tmp_name']),
            array(
                'mp4' => 'video/mp4',
                'mov' => 'video/mov',
                'avi' => 'video/avi',
            ),
            true
        )) {
        throw new RuntimeException('Invalid file format.');
    }

    // You should name it uniquely.
    // DO NOT USE $_FILES['file']['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
    $fileName = sha1_file($_FILES['file']['tmp_name']);
    /*if (!move_uploaded_file($_FILES['file']['tmp_name'], sprintf('/var/www/html/beta.vedocompro.it/web/webtemp/%s.%s', $fileName, $ext ))) {
        throw new RuntimeException('Failed to move uploaded file.');
    }*/
    $ftp_server = 'localhost';
    $ftp_user_name = 'app';
    $ftp_user_pass = 'FOFkom14@_';
    $file = $_FILES['file']['tmp_name'];
    $remote_file = '/var/www/html/beta.vedocompro.it/web/webtemp/'. $fileName;

// set up basic connection
    $conn_id = ftp_connect($ftp_server);

// login with username and password
    $login_result = ftp_login($conn_id, $ftp_user_name, $ftp_user_pass);

// upload a file
    if (ftp_put($conn_id, $remote_file, $file, FTP_ASCII)) {
        echo "successfully uploaded $file\n";
    } else {
        echo "There was a problem while uploading $file\n";
    }

// close the connection
    ftp_close($conn_id);

    /**try {

        $PDO = new PDO('mysql:host=' . $DB_HOST . ';dbname=' . $DB_NAME,$DB_USER,$DB_PASS);
        $insert = $PDO->prepare("INSERT INTO `videos` (`id`, `aid`, `accepted`, `uid`, `dir`) VALUES (NULL, '0', '0', '0', $fileName);");
        $insert->execute();

        echo $fileName;

    } catch(PDOException $exception) {
        echo $exception;
    }
**/


} catch (RuntimeException $e) {

    echo $e->getMessage();

}

    /*if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
        S3Up(VideoConvert($target_file,random_int('1','9999')));
        print "The file ". basename( $_FILES["file"]["name"]). " has been uploaded.";
    } else {
        print "Sorry, there was an error uploading your file.";
    }*/


<?php
/**
 * Created by PhpStorm.
 * User: andreaemili
 * Date: 09/02/18
 * Time: 16:36
 */
?>
<html>
    <head>
        <script src="../js/jquery-2.1.1.min.js" type="text/javascript"></script>
        <script src="../js/bloodhound.min.js" type="text/javascript"></script>
        <script src="../js/typeahead.jquery.min.js" type="text/javascript"></script>
        <link rel="stylesheet" href="http://twitter.github.io/typeahead.js/css/examples.css">
    </head>
    <body>
        <div id="bloodhound">
            <input class="typeahead" type="text" placeholder="Provincia">
        </div>

    <script>
        var id = '54'
        var url = 'get.comune.php?id=' + id
        var provincia = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: {
                url: url,
            }
        });

        $('#bloodhound .typeahead').typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            },
            {
                name: 'nome',
                source: provincia
            });
    </script>
    </body>
</html>

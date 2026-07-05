<?php

namespace AppBundle\Security\Handler;

use HWI\Bundle\OAuthBundle\Security\Core\Exception\AccountNotLinkedException;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

class OAuthFailureHandler implements AuthenticationFailureHandlerInterface {

    public function onAuthenticationFailure( Request $request, AuthenticationException $exception) {

        if ( !$exception instanceof AccountNotLinkedException ) {
            throw $exception;
        }

        return new RedirectResponse( '/registrati' );

    }

}
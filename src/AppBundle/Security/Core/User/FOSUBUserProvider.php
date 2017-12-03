<?php
namespace AppBundle\Security\Core\User;

use AppBundle\Entity\User;
use FOS\UserBundle\Model\UserManagerInterface;
use HWI\Bundle\OAuthBundle\OAuth\Response\UserResponseInterface;
use HWI\Bundle\OAuthBundle\Security\Core\Exception\AccountNotLinkedException;
use HWI\Bundle\OAuthBundle\Security\Core\User\FOSUBUserProvider as BaseClass;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;


// Source: https://gist.github.com/danvbe/4476697

class FOSUBUserProvider extends BaseClass {

    private $session;

    public function __construct(Session $session, UserManagerInterface $userManager, array $properties)
    {
        $this->session = $session;
        parent::__construct($userManager, $properties);
    }

    public function connect(UserInterface $user, UserResponseInterface $response) {
        $property = $this->getProperty($response);

        $username = $response->getUsername();

        // On connect, retrieve the access token and the user id
        $service = $response->getResourceOwner()->getName();

        $setter = 'set' . ucfirst($service);
        $setter_id = $setter . 'Id';
        $setter_token = $setter . 'AccessToken';

        // Disconnect previously connected users
        if (null !== $previousUser = $this->userManager->findUserBy(array($property => $username))) {
            $previousUser->$setter_id(null);
            $previousUser->$setter_token(null);
            $this->userManager->updateUser($previousUser);
        }

        // Connect using the current user
        $user->$setter_id($username);
        $user->$setter_token($response->getAccessToken());
        $this->userManager->updateUser($user);
    }

    public function loadUserByOAuthUserResponse(UserResponseInterface $response) {
        $username = $response->getUsername();

        $email = $response->getEmail() ? $response->getEmail() : $username;
        $realname = $response->getRealName();
        /** @var User $user */
        $user = $this->userManager->findUserByUsername($email);

        $service = $response->getResourceOwner()->getName();
        $setter = 'set' . ucfirst($service);
        $setter_id = $setter . 'Id';
        $setter_token = $setter . 'AccessToken';

        // If the user is new
        if (null === $user) {
            $this->session->set( 'oauth.resource', $response->getResourceOwner()->getName() );
            $this->session->set( 'oauth.email', $email );
            $this->session->set( 'oauth.realname', $realname );
            throw new AccountNotLinkedException();
        }

        $user->$setter_id($username);
        $user->$setter_token($response->getAccessToken());

        return $user;
    }

    /**
     * Generates a random username with the given
     * e.g 12345_github, 12345_facebook
     *
     * @param string $username
     * @param type $serviceName
     * @return type
     */
    private function generateRandomUsername($username, $serviceName){
        if(!$username){
            $username = "user". uniqid((rand()), true) . $serviceName;
        }

        return $username. "_" . $serviceName;
    }
}

class OAuthFailureHandler implements AuthenticationFailureHandlerInterface {

    public function onAuthenticationFailure( Request $request, AuthenticationException $exception) {

        if ( !$exception instanceof AccountNotLinkedException ) {
            throw $exception;
        }

        return new RedirectResponse( '/registrati' );

    }

}
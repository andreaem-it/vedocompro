<?php

namespace PHPCR\Util\Console\Helper\TreeDumper;

use Exception;
use PHPCR\ItemInterface;
use PHPCR\NodeInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * TODO: this should base on the TraversingItemVisitor.
 *
 * @author Daniel Barsotti <daniel.barsotti@liip.ch>
 */
class ConsoleDumperNodeVisitor extends ConsoleDumperItemVisitor
{
    /**
     * Whether to print the UUIDs or not.
     *
     * @var bool
     */
    protected $identifiers;

    /**
     * Show the full path for the node.
     */
    protected $showFullPath;

    /**
     * Instantiate the console dumper visitor.
     *
     * @param OutputInterface $output
     * @param bool            $identifiers whether to output the node UUID
     */
    public function __construct(OutputInterface $output, $identifiers = false)
    {
        parent::__construct($output);
        $this->identifiers = $identifiers;
    }

    /**
     * If to show the full path or not.
     *
     * @param bool $showFullPath
     */
    public function setShowFullPath($showFullPath)
    {
        $this->showFullPath = $showFullPath;
    }

    /**
     * Print information about the visited node.
     *
     * @param ItemInterface $item the node to visit
     *
     * @throws Exception
     */
    public function visit(ItemInterface $item)
    {
        if (!$item instanceof NodeInterface) {
            throw new Exception("Internal error: did not expect to visit a non-node object: $item");
        }

        if ($item->getDepth() === 0) {
            $name = 'ROOT';
        } elseif ($this->showFullPath) {
            $name = $item->getPath();
        } else {
            $name = $item->getName();
        }

        $out = str_repeat('  ', $this->level)
            .'<comment>'.$name.'</comment>';
        if ($this->identifiers) {
            $identifier = $item->getIdentifier();
            if ($identifier) {
                $out .= "($identifier)";
            }
        }
        $out .= ':';
        $this->output->writeln($out);
    }
}

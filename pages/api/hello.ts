import {NextApiRequest, NextApiResponse} from "next";
import {ChunkUtils} from "../../src/utils/chunk";
import styled from "styled-components";

const TEST_NODE_MODULES = styled.div`color: red;`
export default (req: NextApiRequest, res: NextApiResponse) => {
	TEST_NODE_MODULES
	ChunkUtils.testingchunks;
	res.send("HELLO WORLD")
}
import { ApolloServer, gql } from "apollo-server";
import { getLocalDevices, sockets, setupConnections } from "./utils/index.js";

const modeMap = {
  SIMPLE: 0,
  PULSE: 1,
  RAINBOW: 2,
  BOUNCE: 3,
};

const devices = await getLocalDevices();
setupConnections(devices);

const typeDefs = gql`
  type Query {
    allLights: [Light]
  }

  type Mutation {
    setLightState(ip: String, state: LightState!): Light
  }

  type Light {
    ip: String
  }

  enum StateTypes {
    RAINBOW
    SIMPLE
    PULSE
    BOUNCE
  }

  input LightState {
    mode: StateTypes
    on: Boolean
    speed: Float
    hue: Float
    brightness: Float
    saturation: Float
    pulseSpeed: Float
    rainbowSpeed: Float
  }
`;

const resolvers = {
  Query: {
    allLights: async () => {
      const devices = await getLocalDevices();
      setupConnections(devices);
      return devices;
    },
  },
  Mutation: {
    setLightState: async (root, { ip, state }, ctx) => {
      if (!sockets[ip]) {
        console.log("couldnt find open socket");
        return;
      }

      console.log(state);

      let mode = 0;

      if (state.mode) {
        mode = modeMap[state.mode];
      }

      sockets[ip].send(JSON.stringify({ ...state, mode }));

      return { ip: ip };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server
  .listen({
    port: 3000,
  })
  .then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });

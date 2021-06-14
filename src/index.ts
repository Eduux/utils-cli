#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs'
import { join } from 'path'

const command = new Command();

function capitalizeFirstLetter(string: String) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

command.command('initContainer').description('Initializing a new container').action(() => {
  inquirer
    .prompt([
      { type: 'input', name: 'name', message: 'Container name:', validate: (answer) => answer ? true : 'Name cannot be empty!' },
    ])
    .then((answers) => {
      const { name } = answers;

      const nameCapitalize = capitalizeFirstLetter(name);

      fs.mkdirSync(name);
      fs.writeFileSync(join(name, 'dtos.ts'), `export interface IState {}

export interface IActions {
  exampleAction(): void;
}
`)
      fs.writeFileSync(join(name, 'index.tsx'), `import React, {
  useState,
  useCallback,
  useContext,
  memo,
} from 'react';

import changeState from '../helpers/changeState';
import actions from './actions';

import { IActions, IState } from './dtos';

export const initialState = {};

interface IData {
  data: IState;
  actions: IActions;
}

export const ${nameCapitalize}Context = React.createContext<IData>({
  data: initialState,
  actions: actions({ data: initialState, changeState: changeState(() => {}) }),
});

export const use${nameCapitalize} = (): IData => useContext(${nameCapitalize}Context);

export default function with${nameCapitalize}Provider(
  WrappedComponent: React.FC,
  state: IState = initialState,
): React.FC {
  const With${nameCapitalize} = (props: object) => {
    const [data, setData] = useState(state);

    const value = useCallback(
      () => ({
        data,
        actions: actions({ data, changeState: changeState(setData) }),
      }),
      [data],
    );

    const dataValue: IData = value();

    return (
      <${nameCapitalize}Context.Provider value={dataValue}>
        <WrappedComponent {...props} />
      </${nameCapitalize}Context.Provider>
    );
  };

  return memo(With${nameCapitalize});
}
`)
      fs.writeFileSync(join(name, 'actions.ts'), `import { IDataChangeState } from '../helpers/changeState';

import { IActions, IState } from './dtos';

interface IData {
  data: IState;
  changeState(data: IDataChangeState<IState, keyof IState>): void;
}

export default ({ data, changeState }: IData): IActions => ({
  exampleAction: () => {},
});
`)
      if (!fs.existsSync('helpers')) {
        fs.mkdirSync('helpers');
        fs.writeFileSync(join('helpers', 'changeState.ts'), `import { Dispatch, SetStateAction } from 'react';
        
export interface IDataChangeState<T extends any, K extends keyof T> {
  label: K;
  value: T[K];
}

export default <T extends object>(setData: Dispatch<SetStateAction<T>>) => ({
  label,
  value,
}: IDataChangeState<T, keyof T>): void => {
  setData((data: T) => ({
    ...data,
    [label]: value,
  }));
};
`)
      }
    })
});

command.parse(process.argv);


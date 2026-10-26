"""Small stdlib/numpy fallbacks when optional DEAP/scikit-fuzzy aren't installed.

Production installations should use the dedicated dependencies from requirements.txt.
The fallback retains the same public optimization endpoint for lighter local setups.
"""
from __future__ import annotations
import copy
import functools
import random
from types import SimpleNamespace
import numpy as np

class _Fuzzy:
    @staticmethod
    def trimf(x, params):
        a, b, c = params
        out = np.zeros_like(x, dtype=float)
        if b > a:
            idx = (x >= a) & (x <= b)
            out[idx] = (x[idx] - a) / (b - a)
        else:
            out[x <= b] = 1
        if c > b:
            idx = (x >= b) & (x <= c)
            out[idx] = np.maximum(out[idx], (c - x[idx]) / (c - b))
        else:
            out[x >= b] = 1
        out[x == b] = 1
        return out

    @staticmethod
    def interp_membership(x, mf, value):
        return np.interp(value, x, mf)

    @staticmethod
    def defuzz(x, mf, mode):
        if mode != 'centroid':
            raise ValueError('Only centroid defuzzification is supported')
        area = float(np.trapezoid(mf, x))
        return float(np.trapezoid(x * mf, x) / area) if area > 1e-10 else .5

fuzz = _Fuzzy()

class _Fitness:
    def __init__(self): self.values = ()
    @property
    def valid(self): return bool(self.values)

class _Toolbox:
    def register(self, name, func, *args, **kwargs):
        setattr(self, name, functools.partial(func, *args, **kwargs))

class _Creator(SimpleNamespace):
    def create(self, name, parent, **kwargs):
        if issubclass(parent, list) and 'fitness' in kwargs:
            fitness_class = kwargs['fitness']
            class Individual(parent):
                def __init__(self, *a, **kw):
                    super().__init__(*a, **kw)
                    self.fitness = fitness_class()
            Individual.__name__ = name
            setattr(self, name, Individual)
        else:
            setattr(self, name, type(name, (parent,), kwargs))

class _HallOfFame:
    def __init__(self, maxsize):
        self.maxsize = maxsize
        self.items = []
    def update(self, population):
        seen = {tuple(ind) for ind in self.items}
        for ind in population:
            key = tuple(ind)
            if key not in seen:
                self.items.append(copy.deepcopy(ind))
                seen.add(key)
        self.items.sort(key=lambda ind: ind.fitness.values[0], reverse=True)
        self.items = self.items[:self.maxsize]
    def __iter__(self): return iter(self.items)

class _Statistics:
    def __init__(self, key): self.key = key; self.functions = {}
    def register(self, name, func): self.functions[name] = func
    def compile(self, population):
        values = [self.key(ind) for ind in population]
        return {name:func(values) for name,func in self.functions.items()}

def _initRepeat(container, generator, n):
    return container(generator() for _ in range(n))

def _selBest(pop, k):
    return sorted(pop, key=lambda ind: ind.fitness.values[0], reverse=True)[:k]

def _selTournament(pop, k, tournsize):
    return [max(random.choices(pop, k=tournsize), key=lambda i: i.fitness.values[0]) for _ in range(k)]

def _varAnd(pop, toolbox, cxpb, mutpb):
    offspring = [copy.deepcopy(ind) for ind in pop]
    for left in range(1,len(offspring),2):
        if random.random() < cxpb:
            toolbox.mate(offspring[left-1],offspring[left])
            offspring[left-1].fitness.values = ()
            offspring[left].fitness.values = ()
    for individual in offspring:
        if random.random() < mutpb:
            toolbox.mutate(individual)
            individual.fitness.values = ()
    return offspring

base = SimpleNamespace(Fitness=_Fitness, Toolbox=_Toolbox)
creator = _Creator()
tools = SimpleNamespace(initRepeat=_initRepeat, selTournament=_selTournament, selBest=_selBest,
                        HallOfFame=_HallOfFame, Statistics=_Statistics)
algorithms = SimpleNamespace(varAnd=_varAnd)

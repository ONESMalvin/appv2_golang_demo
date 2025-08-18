import React, { useState, useEffect } from "react";
import { Table } from "@ones-design/table";
import { ConfigProvider, Select } from '@ones-design/core'
import { useMemoizedFn } from "ahooks";
import ReactDOM from "react-dom";

const App = () => {

    const [token, setToken] = useState("");
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [teamUsers, setTeamUsers] = useState([]);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        document.dispatchEvent(new CustomEvent("ones:platform:client:sdk", {
            detail: {
                    invoke(SDK) {
                        window.SDK = SDK;
                        setToken(SDK.ONES.getAppToken());
                    }
                }
            }));
        fetchTeams();
    }, []);


    const fetchTeams = useMemoizedFn(async () => {
        setLoading(true);
        const res = await SDK.ONES.fetch("/openapi/v2/account/teams", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();

        const teams = data?.data?.teams || [];
        console.log(teams);
        teams.forEach(team => {
            team.createdAt = new Date(team.createTime/1000).toLocaleString("zh-CN", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        });
        setTeams(teams);
        setLoading(false);
    })

    const onTeamSelect = useMemoizedFn(async (value, opt) => {
        fetchTeamUsers(value);
        fetchProjects(value);
    })

    const fetchTeamUsers = useMemoizedFn(async (value) => {
        const res = await SDK.ONES.fetch(`/openapi/v2/account/users/search?teamID=${value}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();
        const users = data?.data?.list || [];
        setTeamUsers(users);
    })

    const fetchProjects = useMemoizedFn(async (value) => {
        const res = await SDK.ONES.fetch(`/openapi/v2/project/projects?teamID=${value}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();
        const projects = data?.data?.list || [];
        projects.forEach(project => {
            project.createdAt = new Date(project.createTime/1000).toLocaleString("zh-CN", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        });
        setProjects(projects);
    })

    return (
        <div>
            <h1>Teams</h1>
            <button onClick={fetchTeams}>Refresh Teams</button>
            <Table
                columns={[
                    {
                        dataIndex: 'id',
                        lock: true,
                        with: 80,
                        name:'团队UUID'
                    },
                    {
                        code: 'name',
                        name: '团队名称',
                        width: 80,
                    },
                    {
                        code: 'createdAt',
                        name: '创建日期',
                        width: 150
                    },
                    {
                        code: 'owner',
                        name: '团队负责人',
                        width: 150,
                    },
                ]}
                dataSource={teams}
            />
            <h2>Select a team</h2>
            <Select options={teams.map(team => ({
                label: team.name,
                value: team.id
            }))} onChange={onTeamSelect} onSelect={function Ua() {}}/>
            <Table
                columns={[
                    {
                        dataIndex: 'id',
                        lock: true,
                        with: 80,
                        name:'用户UUID'
                    },
                    {
                        dataIndex: 'name',
                        name: '用户名称',
                        width: 80,
                    },
                    {
                        dataIndex: 'email',
                        name: '邮箱',
                        width: 150,
                    },
                ]}
                dataSource={teamUsers}
            />
            <h2>Projects</h2>
            <Table
                columns={[
                    {
                        dataIndex: 'id',
                        with: 80,
                        name: '项目UUID'
                    },
                    {
                        dataIndex: 'name',
                        name: '项目名称'
                    },
                    {
                        dataIndex: 'createdAt',
                        name: '创建时间',
                        width: 150
                    }
                ]}
                dataSource={projects}
            />
        </div>
    )
}

ReactDOM.render(
    <ConfigProvider>
        <App />
    </ConfigProvider>,
    document.body.querySelector('#app')
)
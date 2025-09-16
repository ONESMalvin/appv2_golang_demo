import React, { useState, useEffect } from "react";
import { Table } from "@ones-design/table";
import { ConfigProvider, Select, Button, Spin, Space, Typography, Card } from '@ones-design/core'
import { useMemoizedFn } from "ahooks";
import ReactDOM from "react-dom";
import { ONES } from "@ones-open/sdk";

const { Title, Text } = Typography;

const App = () => {

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [teamUsers, setTeamUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        fetchTeams();
    }, []);


    const fetchTeams = useMemoizedFn(async () => {
        setLoading(true);
        try {
            const res = await ONES.fetchOpenAPI("/v2/account/teams");
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
        } catch (error) {
            console.error('获取团队列表失败:', error);
        } finally {
            setLoading(false);
        }
    })

    const onTeamSelect = useMemoizedFn(async (value, opt) => {
        setSelectedTeam(value);
        fetchTeamUsers(value);
        fetchProjects(value);
    })

    const fetchTeamUsers = useMemoizedFn(async (value) => {
        try {
            const res = await ONES.fetchOpenAPI(`/v2/account/users/search?teamID=${value}`, {
                
            });
            const data = await res.json();
            const users = data?.data?.list || [];
            setTeamUsers(users);
        } catch (error) {
            console.error('获取用户列表失败:', error);
        }
    })

    const fetchProjects = useMemoizedFn(async (value) => {
        try {
            const res = await ONES.fetchOpenAPI(`/v2/project/projects?teamID=${value}`);
            const data = await res.json();
            const projects = data?.data?.list || [];
            projects.forEach(project => {
                console.log(project);
                project.createdAt = new Date(project.createTime).toLocaleString("zh-CN", {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            });
            setProjects(projects);
        } catch (error) {
            console.error('获取项目列表失败:', error);
        }
    })

    return (
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
        }}>
            <div style={{ margin: '0 auto', width: '100%' }}>
                {/* 团队列表部分 */}
                <Card style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Title level={3} style={{ margin: 0 }}>团队列表</Title>
                        <Button type="primary" onClick={fetchTeams} loading={loading}>
                            刷新团队
                        </Button>
                    </div>
                    
                    <Table
                        loading={loading}
                        columns={[
                            {
                                dataIndex: 'id',
                                lock: true,
                                width: 120,
                                name: '团队UUID',
                                render: (text) => <Text code>{text}</Text>
                            },
                            {
                                dataIndex: 'name',
                                name: '团队名称',
                                width: 150,
                            },
                            {
                                dataIndex: 'createdAt',
                                name: '创建日期',
                                width: 180
                            },
                            {
                                dataIndex: 'owner',
                                name: '团队负责人',
                                width: 150,
                            },
                        ]}
                        dataSource={teams}
                        scroll={{ x: 600, y: 400 }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => `共 ${total} 条记录`
                        }}
                    />
                </Card>

                {/* 团队选择部分 */}
                <Card style={{ marginBottom: '24px' }}>
                    <Title level={4} style={{ marginBottom: '16px' }}>选择团队</Title>
                    <Select 
                        style={{ width: '300px' }}
                        placeholder="请选择团队"
                        options={teams.map(team => ({
                            label: team.name,
                            value: team.id
                        }))} 
                        onChange={onTeamSelect}
                        allowClear
                    />
                </Card>

                {/* 用户列表部分 */}
                {selectedTeam && (
                    <Card style={{ marginBottom: '24px' }}>
                        <Title level={4} style={{ marginBottom: '16px' }}>团队成员</Title>
                        <Table
                            columns={[
                                {
                                    dataIndex: 'id',
                                    lock: true,
                                    width: 120,
                                    name: '用户UUID',
                                    render: (text) => <Text code>{text}</Text>
                                },
                                {
                                    dataIndex: 'name',
                                    name: '用户名称',
                                    width: 150,
                                },
                                {
                                    dataIndex: 'email',
                                    name: '邮箱',
                                    width: 200,
                                },
                            ]}
                            dataSource={teamUsers}
                            scroll={{ x: 470, y: 300 }}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `共 ${total} 条记录`
                            }}
                        />
                    </Card>
                )}

                {/* 项目列表部分 */}
                {selectedTeam && (
                    <Card>
                        <Title level={4} style={{ marginBottom: '16px' }}>项目列表</Title>
                        <Table
                            columns={[
                                {
                                    dataIndex: 'id',
                                    width: 120,
                                    name: '项目UUID',
                                    render: (text) => <Text code>{text}</Text>
                                },
                                {
                                    dataIndex: 'name',
                                    name: '项目名称',
                                    width: 200,
                                },
                                {
                                    dataIndex: 'createdAt',
                                    name: '创建时间',
                                    width: 180
                                }
                            ]}
                            dataSource={projects}
                            scroll={{ x: 500, y: 300 }}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `共 ${total} 条记录`
                            }}
                        />
                    </Card>
                )}
            </div>
        </div>
    )
}

ReactDOM.render(
    <ConfigProvider>
        <App />
    </ConfigProvider>,
    document.body.querySelector('#app')
)